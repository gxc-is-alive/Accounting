import { Op } from "sequelize";
import { Family, FamilyMember, FamilyInvite, User } from "../models";
import { AppError, ErrorCode } from "../utils/errors";
import { sequelize } from "../config/database";
import crypto from "crypto";

class FamilyService {
  // 生成邀请码
  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  // 获取用户的家庭列表
  async getUserFamilies(userId: number) {
    try {
      const memberships = await FamilyMember.findAll({
        where: { userId },
        include: [
          {
            model: Family,
            as: "family",
          },
        ],
      });

      // 如果没有加入任何家庭，直接返回空数组
      if (!memberships || memberships.length === 0) {
        return [];
      }

      // 获取每个家庭的详细信息
      const families = await Promise.all(
        memberships.map(async (m: any) => {
          const family = m.family;
          if (!family) return null;

          // 获取成员数量
          const memberCount = await FamilyMember.count({
            where: { familyId: family.id },
          });

          return {
            id: family.id,
            name: family.name,
            createdBy: family.createdBy,
            memberCount,
            myRole: m.role,
          };
        })
      );

      return families.filter((f) => f !== null);
    } catch (error) {
      console.error("获取用户家庭列表失败:", error);
      throw error;
    }
  }

  // 获取家庭成员列表
  async getMembers(familyId: number, userId: number) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname", "email"],
        },
      ],
    });

    return members;
  }

  // 获取单个家庭详情
  async getById(familyId: number, userId: number) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    const family = await Family.findByPk(familyId, {
      include: [
        {
          model: FamilyMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "nickname", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "nickname"],
        },
      ],
    });

    return {
      ...family?.toJSON(),
      myRole: membership.role,
    };
  }

  // 创建家庭
  async create(userId: number, name: string) {
    const t = await sequelize.transaction();

    try {
      // 创建家庭
      const family = await Family.create(
        { name, createdBy: userId },
        { transaction: t }
      );

      // 将创建者添加为管理员
      await FamilyMember.create(
        { familyId: family.id, userId, role: "admin" },
        { transaction: t }
      );

      await t.commit();

      return this.getById(family.id, userId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 更新家庭名称
  async update(familyId: number, userId: number, name: string) {
    // 验证用户是管理员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId, role: "admin" },
    });

    if (!membership) {
      throw new AppError(
        "只有管理员可以修改家庭信息",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const family = await Family.findByPk(familyId);
    if (!family) {
      throw new AppError("家庭不存在", 404, ErrorCode.NOT_FOUND);
    }

    await family.update({ name });
    return this.getById(familyId, userId);
  }

  // 生成邀请码
  async createInvite(familyId: number, userId: number, expiresInHours = 24) {
    // 验证用户是管理员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId, role: "admin" },
    });

    if (!membership) {
      throw new AppError("只有管理员可以生成邀请码", 403, ErrorCode.FORBIDDEN);
    }

    const code = this.generateInviteCode();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invite = await FamilyInvite.create({
      familyId,
      code,
      expiresAt,
    });

    return {
      code: invite.code,
      expiresAt: invite.expiresAt,
    };
  }

  // 通过邀请码加入家庭
  async joinByCode(userId: number, code: string) {
    const invite = await FamilyInvite.findOne({
      where: { code },
      include: [{ model: Family, as: "family" }],
    });

    if (!invite) {
      throw new AppError("邀请码不存在", 404, ErrorCode.NOT_FOUND);
    }

    if (!invite.isValid()) {
      throw new AppError(
        "邀请码已过期或已使用",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // 检查是否已经是成员
    const existingMember = await FamilyMember.findOne({
      where: { familyId: invite.familyId, userId },
    });

    if (existingMember) {
      throw new AppError(
        "您已经是该家庭的成员",
        400,
        ErrorCode.DUPLICATE_ENTRY
      );
    }

    const t = await sequelize.transaction();

    try {
      // 添加成员
      await FamilyMember.create(
        { familyId: invite.familyId, userId, role: "member" },
        { transaction: t }
      );

      // 标记邀请码已使用
      await invite.update({ used: true }, { transaction: t });

      await t.commit();

      return this.getById(invite.familyId, userId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 移除成员
  async removeMember(
    familyId: number,
    adminUserId: number,
    targetUserId: number
  ) {
    // 验证操作者是管理员
    const adminMembership = await FamilyMember.findOne({
      where: { familyId, userId: adminUserId, role: "admin" },
    });

    if (!adminMembership) {
      throw new AppError("只有管理员可以移除成员", 403, ErrorCode.FORBIDDEN);
    }

    // 不能移除自己
    if (adminUserId === targetUserId) {
      throw new AppError(
        "不能移除自己，请使用退出家庭功能",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const targetMembership = await FamilyMember.findOne({
      where: { familyId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new AppError("该用户不是家庭成员", 404, ErrorCode.NOT_FOUND);
    }

    await targetMembership.destroy();
  }

  // 退出家庭
  async leave(familyId: number, userId: number) {
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 404, ErrorCode.NOT_FOUND);
    }

    // 检查是否是唯一的管理员
    if (membership.role === "admin") {
      const adminCount = await FamilyMember.count({
        where: { familyId, role: "admin" },
      });

      if (adminCount === 1) {
        // 检查是否还有其他成员
        const memberCount = await FamilyMember.count({ where: { familyId } });

        if (memberCount > 1) {
          throw new AppError(
            "您是唯一的管理员，请先指定其他管理员或移除所有成员",
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // 如果是最后一个成员，删除整个家庭
        const t = await sequelize.transaction();
        try {
          await membership.destroy({ transaction: t });
          await Family.destroy({ where: { id: familyId }, transaction: t });
          await t.commit();
          return;
        } catch (error) {
          await t.rollback();
          throw error;
        }
      }
    }

    await membership.destroy();
  }

  // 设置成员角色
  async setMemberRole(
    familyId: number,
    adminUserId: number,
    targetUserId: number,
    role: "admin" | "member"
  ) {
    // 验证操作者是管理员
    const adminMembership = await FamilyMember.findOne({
      where: { familyId, userId: adminUserId, role: "admin" },
    });

    if (!adminMembership) {
      throw new AppError(
        "只有管理员可以修改成员角色",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const targetMembership = await FamilyMember.findOne({
      where: { familyId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new AppError("该用户不是家庭成员", 404, ErrorCode.NOT_FOUND);
    }

    await targetMembership.update({ role });
    return this.getById(familyId, adminUserId);
  }
}

export default new FamilyService();
