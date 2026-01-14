import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 余额调整记录属性接口
interface BalanceAdjustmentAttributes {
  id: number;
  userId: number;
  accountId: number;
  previousBalance: number;
  newBalance: number;
  difference: number;
  note?: string;
  createdAt?: Date;
}

// 创建时可选的属性
interface BalanceAdjustmentCreationAttributes
  extends Optional<BalanceAdjustmentAttributes, "id" | "note" | "createdAt"> {}

// 余额调整记录模型类
class BalanceAdjustment
  extends Model<
    BalanceAdjustmentAttributes,
    BalanceAdjustmentCreationAttributes
  >
  implements BalanceAdjustmentAttributes
{
  public id!: number;
  public userId!: number;
  public accountId!: number;
  public previousBalance!: number;
  public newBalance!: number;
  public difference!: number;
  public note?: string;
  public readonly createdAt!: Date;

  // 判断是否为盈利
  public isProfit(): boolean {
    return this.difference > 0;
  }

  // 判断是否为亏损
  public isLoss(): boolean {
    return this.difference < 0;
  }

  // 获取差额类型
  public getDifferenceType(): "profit" | "loss" | "none" {
    if (this.difference > 0) return "profit";
    if (this.difference < 0) return "loss";
    return "none";
  }
}

BalanceAdjustment.init(
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
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "account_id",
    },
    previousBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "previous_balance",
      get() {
        const value = this.getDataValue("previousBalance");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    newBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "new_balance",
      get() {
        const value = this.getDataValue("newBalance");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    difference: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("difference");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "balance_adjustments",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default BalanceAdjustment;
