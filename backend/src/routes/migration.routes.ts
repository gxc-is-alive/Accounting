/**
 * 数据库迁移路由
 */

import { Router, Request, Response } from "express";
import migrationService from "../services/migration.service";

const router = Router();

/**
 * GET /api/migration/status
 * 获取迁移状态
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const status = await migrationService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: "获取迁移状态失败",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/migration/run
 * 执行迁移
 */
router.post("/run", async (req: Request, res: Response) => {
  try {
    console.log("开始执行数据库迁移...");
    const result = await migrationService.migrate();

    if (result.success) {
      res.json({
        message:
          result.executed.length > 0 ? "迁移执行成功" : "数据库已是最新版本",
        ...result,
      });
    } else {
      res.status(500).json({
        message: "迁移执行失败",
        ...result,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "迁移执行失败",
      message: (error as Error).message,
    });
  }
});

export default router;
