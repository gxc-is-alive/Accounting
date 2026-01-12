import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 分类类型
export type CategoryType = "income" | "expense";

// 分类属性接口
export interface CategoryAttributes {
  id: number;
  userId: number | null;
  name: string;
  type: CategoryType;
  icon: string;
  parentId: number | null;
  isSystem: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建分类时的可选属性
export interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    | "id"
    | "icon"
    | "parentId"
    | "isSystem"
    | "sortOrder"
    | "createdAt"
    | "updatedAt"
  > {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public userId!: number | null;
  public name!: string;
  public type!: CategoryType;
  public icon!: string;
  public parentId!: number | null;
  public isSystem!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
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
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "default",
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "parent_id",
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
    tableName: "categories",
    underscored: true,
  }
);

export default Category;
