import { DataTypes, Model, Optional, Op } from "sequelize";
import sequelize from "../config/database";

// Token 黑名单属性接口
interface TokenBlacklistAttributes {
  id: number;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}

// 创建时可选的属性
interface TokenBlacklistCreationAttributes
  extends Optional<TokenBlacklistAttributes, "id" | "createdAt"> {}

// Token 黑名单模型类
class TokenBlacklist
  extends Model<TokenBlacklistAttributes, TokenBlacklistCreationAttributes>
  implements TokenBlacklistAttributes
{
  public id!: number;
  public token!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;

  // 检查 token 是否在黑名单中
  public static async isBlacklisted(token: string): Promise<boolean> {
    const record = await TokenBlacklist.findOne({
      where: { token },
    });
    return !!record;
  }

  // 添加 token 到黑名单
  public static async addToBlacklist(
    token: string,
    expiresAt: Date
  ): Promise<TokenBlacklist> {
    return TokenBlacklist.create({ token, expiresAt });
  }

  // 清理过期的黑名单记录
  public static async cleanExpired(): Promise<number> {
    const result = await TokenBlacklist.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });
    return result;
  }
}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    sequelize,
    tableName: "token_blacklist",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ["token"],
      },
      {
        fields: ["expires_at"],
      },
    ],
  }
);

export default TokenBlacklist;
