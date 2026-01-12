import dotenv from "dotenv";

dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // 数据库配置
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    name: process.env.DB_NAME || "family_accounting",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // DeepSeek API 配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    maxTokens: 1000,
    temperature: 0.7,
  },
};

export default config;
