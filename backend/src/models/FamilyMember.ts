import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 成员角色
export type MemberRole = "admin" | "member";

// 家庭成员属性接口
export interface FamilyMemberAttributes {
  id: number;
  familyId: number;
  userId: number;
  role: MemberRole;
  joinedAt?: Date;
}

// 创建家庭成员时的可选属性
export interface FamilyMemberCreationAttributes
  extends Optional<FamilyMemberAttributes, "id" | "role" | "joinedAt"> {}

class FamilyMember
  extends Model<FamilyMemberAttributes, FamilyMemberCreationAttributes>
  implements FamilyMemberAttributes
{
  public id!: number;
  public familyId!: number;
  public userId!: number;
  public role!: MemberRole;
  public readonly joinedAt!: Date;
}

FamilyMember.init(
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
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "joined_at",
    },
  },
  {
    sequelize,
    tableName: "family_members",
    underscored: true,
    timestamps: false,
  }
);

export default FamilyMember;
