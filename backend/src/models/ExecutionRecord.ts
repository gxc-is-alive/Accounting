import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 执行状态
export type ExecutionStatus = "success" | "failed";

// 执行记录属性接口
interface ExecutionRecordAttributes {
  id: number;
  planId: number | null;
  userId: number;
  sourceAccountId: number;
  targetAccountId: number;
  paidAmount: number;
  investedAmount: number;
  discountRate: number;
  shares: number;
  netValue: number;
  status: ExecutionStatus;
  failReason?: string;
  executedAt: Date;
  createdAt?: Date;
}

// 创建时可选的属性
interface ExecutionRecordCreationAttributes
  extends Optional<
    ExecutionRecordAttributes,
    "id" | "planId" | "discountRate" | "failReason" | "createdAt"
  > {}

// 执行记录模型类
class ExecutionRecord
  extends Model<ExecutionRecordAttributes, ExecutionRecordCreationAttributes>
  implements ExecutionRecordAttributes
{
  public id!: number;
  public planId!: number | null;
  public userId!: number;
  public sourceAccountId!: number;
  public targetAccountId!: number;
  public paidAmount!: number;
  public investedAmount!: number;
  public discountRate!: number;
  public shares!: number;
  public netValue!: number;
  public status!: ExecutionStatus;
  public failReason?: string;
  public executedAt!: Date;
  public readonly createdAt!: Date;

  // 判断是否成功
  public isSuccess(): boolean {
    return this.status === "success";
  }

  // 判断是否有折扣
  public hasDiscount(): boolean {
    return this.discountRate < 1;
  }

  // 获取折扣百分比（如 5% 折扣返回 5）
  public getDiscountPercentage(): number {
    return Math.round((1 - this.discountRate) * 100 * 100) / 100;
  }
}

ExecutionRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "plan_id",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
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
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "paid_amount",
      get() {
        const value = this.getDataValue("paidAmount");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    investedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "invested_amount",
      get() {
        const value = this.getDataValue("investedAmount");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    discountRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 1.0,
      field: "discount_rate",
      get() {
        const value = this.getDataValue("discountRate");
        return value ? parseFloat(value.toString()) : 1;
      },
    },
    shares: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue("shares");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    netValue: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      field: "net_value",
      get() {
        const value = this.getDataValue("netValue");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    status: {
      type: DataTypes.ENUM("success", "failed"),
      allowNull: false,
    },
    failReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "fail_reason",
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "executed_at",
    },
  },
  {
    sequelize,
    tableName: "execution_records",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default ExecutionRecord;
