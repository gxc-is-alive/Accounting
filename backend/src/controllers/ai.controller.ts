import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import aiService from "../services/ai.service";
import { success, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class AIController {
  // 解析自然语言记账文本
  async parse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { text } = req.body;
      const result = await aiService.parseTransaction(text, req.user.id);

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 分析消费习惯
  async analyze(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { months } = req.query;
      const result = await aiService.analyzeSpending(
        req.user.id,
        months ? parseInt(months as string, 10) : 3
      );

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // AI 问答
  async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { question } = req.body;
      const answer = await aiService.chat(req.user.id, question);

      return success(res, { answer });
    } catch (err) {
      next(err);
    }
  }
}

export default new AIController();
