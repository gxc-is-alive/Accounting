import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 预算属性接口
export interface BudgetAttributes {
  id: number;
  userId: number;
  categoryId: number | null;
  amount: number;
  month: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建预算时的可选属性
export interface BudgetCreationAttributes
  extends Optional<
    BudgetAttributes,
    "id" | "categoryId" | "createdAt" | "updatedAt"
  > {}

class Budget
  extends Model<BudgetAttributes, BudgetCreationAttributes>
  implements BudgetAttributes
{
  public id!: number;
  public userId!: number;
  public categoryId!: number | null;
  public amount!: number;
  public month!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Budget.init(
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
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "category_id",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("amount");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "budgets",
    underscored: true,
  }
);

export default Budget;
