import { config } from "../config";
import { Category, Transaction } from "../models";
import { Op } from "sequelize";

interface ParsedTransaction {
  amount: number;
  type: "income" | "expense";
  categoryName: string;
  note: string;
  date: string;
  confidence: number;
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  suggestions: string[];
}

class AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = config.deepseek?.apiKey || "";
    this.apiUrl =
      (config.deepseek?.baseUrl || "https://api.deepseek.com/v1") +
      "/chat/completions";
  }

  // 调用 DeepSeek API
  private async callDeepSeek(
    messages: Array<{ role: string; content: string }>
  ) {
    if (!this.apiKey) {
      throw new Error("DeepSeek API Key 未配置");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 调用失败: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || "";
  }

  // 解析自然语言记账文本
  async parseTransaction(
    text: string,
    userId: number
  ): Promise<ParsedTransaction> {
    // 获取用户可用的分类
    const categories = await Category.findAll({
      where: {
        [Op.or]: [{ userId: null, isSystem: true }, { userId }],
      },
      attributes: ["name", "type"],
    });

    const categoryList = categories
      .map((c) => `${c.name}(${c.type})`)
      .join(", ");

    const prompt = `你是一个记账助手。请解析以下记账文本，提取金额、类型（收入/支出）、分类和备注。

可用分类: ${categoryList}

记账文本: "${text}"

请以JSON格式返回，格式如下:
{
  "amount": 数字,
  "type": "income" 或 "expense",
  "categoryName": "分类名称",
  "note": "备注",
  "date": "YYYY-MM-DD格式的日期，如果没有提到日期则返回今天",
  "confidence": 0-1之间的置信度
}

只返回JSON，不要其他内容。`;

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content: "你是一个专业的记账助手，擅长解析自然语言记账文本。",
        },
        { role: "user", content: prompt },
      ]);

      // 提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析AI响应");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 如果没有日期，使用今天
      if (!parsed.date) {
        parsed.date = new Date().toISOString().split("T")[0];
      }

      return parsed;
    } catch (error) {
      // 降级处理：尝试简单解析
      return this.simpleParseTransaction(text);
    }
  }

  // 简单解析（降级方案）
  private simpleParseTransaction(text: string): ParsedTransaction {
    // 提取金额
    const amountMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // 判断类型
    const incomeKeywords = ["收入", "工资", "奖金", "红包", "收到", "进账"];
    const isIncome = incomeKeywords.some((k) => text.includes(k));

    return {
      amount,
      type: isIncome ? "income" : "expense",
      categoryName: isIncome ? "其他收入" : "其他支出",
      note: text,
      date: new Date().toISOString().split("T")[0],
      confidence: 0.3,
    };
  }

  // 分析消费习惯
  async analyzeSpending(
    userId: number,
    months: number = 3
  ): Promise<AnalysisResult> {
    // 获取最近几个月的交易数据
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startDate.toISOString().split("T")[0] },
      },
      include: [
        { model: Category, as: "category", attributes: ["name", "type"] },
      ],
      order: [["date", "DESC"]],
    });

    if (transactions.length === 0) {
      return {
        summary: "暂无足够的交易数据进行分析",
        insights: [],
        suggestions: ["开始记录您的日常收支，积累数据后可获得个性化分析"],
      };
    }

    // 数据脱敏：只传递统计数据，不传递具体金额
    const stats = this.aggregateTransactions(transactions);

    const prompt = `作为财务分析师，请根据以下消费统计数据提供分析和建议。

统计周期: 最近${months}个月
总交易笔数: ${stats.totalCount}
收入笔数: ${stats.incomeCount}, 支出笔数: ${stats.expenseCount}
收支比例: 收入占${stats.incomeRatio}%, 支出占${stats.expenseRatio}%

支出分类分布:
${stats.expenseCategories
  .map((c) => `- ${c.name}: ${c.percentage}%`)
  .join("\n")}

收入分类分布:
${stats.incomeCategories.map((c) => `- ${c.name}: ${c.percentage}%`).join("\n")}

请提供:
1. 一句话总结消费习惯
2. 3-5条消费洞察
3. 3-5条理财建议

以JSON格式返回:
{
  "summary": "总结",
  "insights": ["洞察1", "洞察2", ...],
  "suggestions": ["建议1", "建议2", ...]
}`;

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content:
            "你是一个专业的家庭财务顾问，擅长分析消费习惯并提供实用建议。",
        },
        { role: "user", content: prompt },
      ]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析AI响应");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      return {
        summary: "消费分析暂时不可用",
        insights: ["请稍后重试"],
        suggestions: ["继续保持记账习惯"],
      };
    }
  }

  // 聚合交易数据（脱敏）
  private aggregateTransactions(transactions: Transaction[]) {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const expenseByCategory = new Map<string, number>();
    const incomeByCategory = new Map<string, number>();

    for (const t of transactions) {
      const cat = (t as any).category;
      const catName = cat?.name || "未分类";

      if (t.type === "income") {
        incomeTotal += t.amount;
        incomeByCategory.set(
          catName,
          (incomeByCategory.get(catName) || 0) + t.amount
        );
      } else {
        expenseTotal += t.amount;
        expenseByCategory.set(
          catName,
          (expenseByCategory.get(catName) || 0) + t.amount
        );
      }
    }

    const total = incomeTotal + expenseTotal;

    return {
      totalCount: transactions.length,
      incomeCount: transactions.filter((t) => t.type === "income").length,
      expenseCount: transactions.filter((t) => t.type === "expense").length,
      incomeRatio: total > 0 ? Math.round((incomeTotal / total) * 100) : 0,
      expenseRatio: total > 0 ? Math.round((expenseTotal / total) * 100) : 0,
      expenseCategories: Array.from(expenseByCategory.entries())
        .map(([name, amount]) => ({
          name,
          percentage:
            expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage),
      incomeCategories: Array.from(incomeByCategory.entries())
        .map(([name, amount]) => ({
          name,
          percentage:
            incomeTotal > 0 ? Math.round((amount / incomeTotal) * 100) : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage),
    };
  }

  // AI 问答
  async chat(userId: number, question: string): Promise<string> {
    // 获取用户基本统计数据作为上下文
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startOfMonth },
      },
      attributes: ["type", "amount"],
    });

    let monthIncome = 0;
    let monthExpense = 0;
    for (const t of transactions) {
      if (t.type === "income") monthIncome += t.amount;
      else monthExpense += t.amount;
    }

    const context = `用户本月收入约${Math.round(
      monthIncome
    )}元，支出约${Math.round(monthExpense)}元，结余约${Math.round(
      monthIncome - monthExpense
    )}元。`;

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content: `你是一个友好的家庭财务助手。${context} 请根据用户的问题提供简洁实用的回答。`,
        },
        { role: "user", content: question },
      ]);

      return response;
    } catch (error) {
      return "抱歉，AI 助手暂时无法回答您的问题，请稍后重试。";
    }
  }
}

export default new AIService();
