import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 频率类型
export type FrequencyType = "daily" | "weekly" | "monthly";

// 计划状态
export type PlanStatus = "active" | "paused" | "deleted";

// 定投计划属性接口
interface AutoInvestmentPlanAttributes {
  id: number;
  userId: number;
  name: string;
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  frequency: FrequencyType;
  executionDay?: number;
  executionTime: string;
  status: PlanStatus;
  nextExecutionDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建时可选的属性
interface AutoInvestmentPlanCreationAttributes
  extends Optional<
    AutoInvestmentPlanAttributes,
    | "id"
    | "executionDay"
    | "executionTime"
    | "status"
    | "createdAt"
    | "updatedAt"
  > {}

// 定投计划模型类
class AutoInvestmentPlan
  extends Model<
    AutoInvestmentPlanAttributes,
    AutoInvestmentPlanCreationAttributes
  >
  implements AutoInvestmentPlanAttributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public sourceAccountId!: number;
  public targetAccountId!: number;
  public amount!: number;
  public frequency!: FrequencyType;
  public executionDay?: number;
  public executionTime!: string;
  public status!: PlanStatus;
  public nextExecutionDate!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 判断是否为启用状态
  public isActive(): boolean {
    return this.status === "active";
  }

  // 判断是否为暂停状态
  public isPaused(): boolean {
    return this.status === "paused";
  }

  // 判断是否已删除
  public isDeleted(): boolean {
    return this.status === "deleted";
  }
}

AutoInvestmentPlan.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sourceAccountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "source_account_id",
    },
    targetAccountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "target_account_id",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("amount");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    frequency: {
      type: DataTypes.ENUM("daily", "weekly", "monthly"),
      allowNull: false,
    },
    executionDay: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "execution_day",
    },
    executionTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "09:00",
      field: "execution_time",
    },
    status: {
      type: DataTypes.ENUM("active", "paused", "deleted"),
      allowNull: false,
      defaultValue: "active",
    },
    nextExecutionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "next_execution_date",
    },
  },
  {
    sequelize,
    tableName: "auto_investment_plans",
    timestamps: true,
    underscored: true,
  }
);

export default AutoInvestmentPlan;
