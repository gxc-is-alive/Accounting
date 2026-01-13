import express, { Application } from "express";
import cors from "cors";
import { config } from "./config";
import { testConnection } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import categoryRoutes from "./routes/category.routes";
import billTypeRoutes from "./routes/billType.routes";
import transactionRoutes from "./routes/transaction.routes";
import familyRoutes from "./routes/family.routes";
import statisticsRoutes from "./routes/statistics.routes";
import budgetRoutes from "./routes/budget.routes";
import aiRoutes from "./routes/ai.routes";
import repaymentRoutes from "./routes/repayment.routes";
import exportRoutes from "./routes/export.routes";
import attachmentRoutes from "./routes/attachment.routes";

// 创建 Express 应用
const app: Application = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bill-types", billTypeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/attachments", attachmentRoutes);

// 静态文件服务 - 用于访问上传的附件
app.use("/uploads", express.static("uploads"));
// app.use('/api/categories', categoryRoutes);
// app.use('/api/bill-types', billTypeRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/families', familyRoutes);
// app.use('/api/budgets', budgetRoutes);
// app.use('/api/statistics', statisticsRoutes);
// app.use('/api/ai', aiRoutes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async (): Promise<void> => {
  try {
    // 测试数据库连接
    await testConnection();

    // 启动服务器
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`);
      console.log(`环境: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("服务器启动失败:", error);
    process.exit(1);
  }
};

startServer();

export default app;
