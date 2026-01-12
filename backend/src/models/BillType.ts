import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 账单类型属性接口
export interface BillTypeAttributes {
  id: number;
  userId: number | null;
  name: string;
  description: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建账单类型时的可选属性
export interface BillTypeCreationAttributes
  extends Optional<
    BillTypeAttributes,
    | "id"
    | "description"
    | "icon"
    | "isSystem"
    | "sortOrder"
    | "createdAt"
    | "updatedAt"
  > {}

class BillType
  extends Model<BillTypeAttributes, BillTypeCreationAttributes>
  implements BillTypeAttributes
{
  public id!: number;
  public userId!: number | null;
  public name!: string;
  public description!: string;
  public icon!: string;
  public isSystem!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BillType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "user_id",
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "default",
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_system",
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "sort_order",
    },
  },
  {
    sequelize,
    tableName: "bill_types",
    underscored: true,
  }
);

export default BillType;
