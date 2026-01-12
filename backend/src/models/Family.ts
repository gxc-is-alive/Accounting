import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 家庭属性接口
export interface FamilyAttributes {
  id: number;
  name: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建家庭时的可选属性
export interface FamilyCreationAttributes
  extends Optional<FamilyAttributes, "id" | "createdAt" | "updatedAt"> {}

class Family
  extends Model<FamilyAttributes, FamilyCreationAttributes>
  implements FamilyAttributes
{
  public id!: number;
  public name!: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Family.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    sequelize,
    tableName: "families",
    underscored: true,
  }
);

export default Family;
