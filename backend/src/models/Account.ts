import {
  DataTypes,
  Model,
  Optional,
  Transaction as SequelizeTransaction,
} from "sequelize";
import sequelize from "../config/database";
import type { AccountType } from "../types";

// 账户属性接口
interface AccountAttributes {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  // 信用账户扩展字段
  creditLimit?: number; // 信用额度
  billingDay?: number; // 账单日 (1-28)
  dueDay?: number; // 还款日 (1-28)
  // 投资账户扩展字段
  shares?: number; // 持仓份额
  costPrice?: number; // 成本价（每份）
  currentNetValue?: number; // 当前净值
  createdAt?: Date;
}

// 创建账户时可选的属性
interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | "id"
    | "balance"
    | "icon"
    | "creditLimit"
    | "billingDay"
    | "dueDay"
    | "shares"
    | "costPrice"
    | "currentNetValue"
    | "createdAt"
  > {}

// 账户模型类
class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public type!: AccountType;
  public balance!: number;
  public icon?: string;
  // 信用账户扩展字段
  public creditLimit?: number;
  public billingDay?: number;
  public dueDay?: number;
  // 投资账户扩展字段
  public shares?: number;
  public costPrice?: number;
  public currentNetValue?: number;
  public readonly createdAt!: Date;

  // 更新余额（支持事务）
  public async updateBalance(
    amount: number,
    transaction?: SequelizeTransaction
  ): Promise<void> {
    this.balance = Number(this.balance) + Number(amount);
    await this.save({ transaction });
  }

  // 判断是否为信用账户
  public isCreditAccount(): boolean {
    return this.type === "credit";
  }

  // 判断是否为投资账户
  public isInvestmentAccount(): boolean {
    return this.type === "investment";
  }

  // 更新投资账户市值（份额 × 净值）
  public updateMarketValue(): void {
    if (this.isInvestmentAccount() && this.shares && this.currentNetValue) {
      this.balance = Number(this.shares) * Number(this.currentNetValue);
    }
  }

  // 获取投资账户总成本
  public getTotalCost(): number {
    if (this.isInvestmentAccount() && this.shares && this.costPrice) {
      return Number(this.shares) * Number(this.costPrice);
    }
    return 0;
  }

  // 获取投资账户盈亏
  public getProfit(): number {
    if (this.isInvestmentAccount()) {
      return Number(this.balance) - this.getTotalCost();
    }
    return 0;
  }

  // 获取投资账户收益率
  public getProfitRate(): number {
    const totalCost = this.getTotalCost();
    if (totalCost > 0) {
      return (this.getProfit() / totalCost) * 100;
    }
    return 0;
  }
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "cash",
        "bank",
        "alipay",
        "wechat",
        "credit",
        "investment",
        "other"
      ),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue("balance");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // 信用账户扩展字段
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "credit_limit",
      get() {
        const value = this.getDataValue("creditLimit");
        return value ? parseFloat(value.toString()) : undefined;
      },
    },
    billingDay: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "billing_day",
      validate: {
        min: 1,
        max: 28,
      },
    },
    dueDay: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "due_day",
      validate: {
        min: 1,
        max: 28,
      },
    },
    // 投资账户扩展字段
    shares: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue("shares");
        return value ? parseFloat(value.toString()) : undefined;
      },
    },
    costPrice: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      field: "cost_price",
      get() {
        const value = this.getDataValue("costPrice");
        return value ? parseFloat(value.toString()) : undefined;
      },
    },
    currentNetValue: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      field: "current_net_value",
      get() {
        const value = this.getDataValue("currentNetValue");
        return value ? parseFloat(value.toString()) : undefined;
      },
    },
  },
  {
    sequelize,
    tableName: "accounts",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default Account;
