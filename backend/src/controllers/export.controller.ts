/**
 * 数据导出控制器
 * Feature: data-export-docker
 */

import { Response, NextFunction } from "express";
import { exportService } from "../services/export.service";
import { success, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class ExportController {
  /**
   * 导出用户数据为 JSON
   * GET /api/export/json
   */
  async exportJson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const includeFamily = req.query.includeFamily === "true";
      const data = await exportService.exportToJson(req.user.id, includeFamily);

      // 设置下载头
      const filename = `export_${new Date().toISOString().split("T")[0]}.json`;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 导出交易记录为 CSV
   * GET /api/export/csv
   */
  async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const csv = await exportService.exportToCsv(req.user.id, start, end);

      // 设置下载头
      const filename = `transactions_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      return res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 导入数据
   * POST /api/export/import
   */
  async importData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { data, mode = "skip" } = req.body;

      if (!data) {
        return error(res, "缺少导入数据", ErrorCode.VALIDATION_ERROR, 400);
      }

      // 验证数据格式
      const validation = exportService.validateImportData(data);
      if (!validation.valid) {
        return error(
          res,
          validation.errors.join("; "),
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      // 执行导入
      const result = await exportService.importFromJson(
        req.user.id,
        data,
        mode as "skip" | "overwrite"
      );

      return success(res, result, "数据导入完成");
    } catch (err) {
      next(err);
    }
  }
}

export default new ExportController();
