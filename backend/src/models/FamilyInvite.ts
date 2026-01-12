import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 家庭邀请属性接口
export interface FamilyInviteAttributes {
  id: number;
  familyId: number;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
}

// 创建家庭邀请时的可选属性
export interface FamilyInviteCreationAttributes
  extends Optional<FamilyInviteAttributes, "id" | "used" | "createdAt"> {}

class FamilyInvite
  extends Model<FamilyInviteAttributes, FamilyInviteCreationAttributes>
  implements FamilyInviteAttributes
{
  public id!: number;
  public familyId!: number;
  public code!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;

  // 检查邀请码是否有效
  public isValid(): boolean {
    return !this.used && new Date() < this.expiresAt;
  }
}

FamilyInvite.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    familyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "family_id",
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "family_invites",
    underscored: true,
    updatedAt: false,
  }
);

export default FamilyInvite;
