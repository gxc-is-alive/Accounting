import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 估值记录属性接口
interface ValuationAttributes {
  id: number;
  accountId: number;
  netValue: number;
  marketValue: number;
  date: string;
  createdAt?: Date;
}

// 创建估值记录时可选的属性
interface ValuationCreationAttributes
  extends Optional<ValuationAttributes, "id" | "createdAt"> {}

// 估值记录模型类
class Valuation
  extends Model<ValuationAttributes, ValuationCreationAttributes>
  implements ValuationAttributes
{
  public id!: number;
  public accountId!: number;
  public netValue!: number;
  public marketValue!: number;
  public date!: string;
  public readonly createdAt!: Date;
}

Valuation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "account_id",
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
    marketValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "market_value",
      get() {
        const value = this.getDataValue("marketValue");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "valuations",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default Valuation;
