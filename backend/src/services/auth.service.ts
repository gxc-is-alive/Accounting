import jwt from "jsonwebtoken";
import { User, TokenBlacklist } from "../models";
import { config } from "../config";
import { AppError, ErrorCode } from "../utils/errors";
import type { UserPayload } from "../types";

interface RegisterData {
  email: string;
  password: string;
  nickname: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    nickname: string;
  };
}

class AuthService {
  // 注册新用户
  async register(data: RegisterData): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError("该邮箱已被注册", 409, ErrorCode.EMAIL_EXISTS);
    }

    // 创建用户
    const user = await User.create({
      email: data.email,
      password: data.password,
      nickname: data.nickname,
    });

    return user;
  }

  // 用户登录
  async login(data: LoginData): Promise<LoginResult> {
    // 查找用户
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new AppError("邮箱或密码错误", 401, ErrorCode.INVALID_CREDENTIALS);
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(data.password);
    if (!isValidPassword) {
      throw new AppError("邮箱或密码错误", 401, ErrorCode.INVALID_CREDENTIALS);
    }

    // 生成 JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  // 退出登录
  async logout(token: string): Promise<void> {
    // 解析 token 获取过期时间
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        // 将 token 加入黑名单
        await TokenBlacklist.addToBlacklist(token, expiresAt);
      }
    } catch {
      // 忽略解析错误
    }
  }

  // 获取当前用户信息
  async getCurrentUser(userId: number): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("用户不存在", 404, ErrorCode.USER_NOT_FOUND);
    }
    return user;
  }

  // 生成 JWT token
  generateToken(payload: UserPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  // 验证 JWT token
  async verifyToken(token: string): Promise<UserPayload> {
    // 检查 token 是否在黑名单中
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError("Token 已失效", 401, ErrorCode.TOKEN_INVALID);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Token 已过期", 401, ErrorCode.TOKEN_EXPIRED);
      }
      throw new AppError("无效的 Token", 401, ErrorCode.TOKEN_INVALID);
    }
  }
}

export default new AuthService();
