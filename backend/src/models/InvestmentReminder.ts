import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 提醒类型
export type ReminderType = "execution_failed" | "insufficient_balance";

// 投资提醒属性接口
interface InvestmentReminderAttributes {
  id: number;
  userId: number;
  planId: number;
  type: ReminderType;
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

// 创建时可选的属性
interface InvestmentReminderCreationAttributes
  extends Optional<
    InvestmentReminderAttributes,
    "id" | "isRead" | "createdAt"
  > {}

// 投资提醒模型类
class InvestmentReminder
  extends Model<
    InvestmentReminderAttributes,
    InvestmentReminderCreationAttributes
  >
  implements InvestmentReminderAttributes
{
  public id!: number;
  public userId!: number;
  public planId!: number;
  public type!: ReminderType;
  public message!: string;
  public isRead!: boolean;
  public readonly createdAt!: Date;

  // 判断是否为执行失败提醒
  public isExecutionFailed(): boolean {
    return this.type === "execution_failed";
  }

  // 判断是否为余额不足提醒
  public isInsufficientBalance(): boolean {
    return this.type === "insufficient_balance";
  }
}

InvestmentReminder.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "plan_id",
    },
    type: {
      type: DataTypes.ENUM("execution_failed", "insufficient_balance"),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_read",
    },
  },
  {
    sequelize,
    tableName: "investment_reminders",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default InvestmentReminder;
