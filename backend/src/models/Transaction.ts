import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 交易类型
export type TransactionType = "income" | "expense" | "repayment";

// 交易属性接口
export interface TransactionAttributes {
  id: number;
  userId: number;
  familyId: number | null;
  accountId: number;
  categoryId: number;
  billTypeId: number;
  type: TransactionType;
  amount: number;
  date: Date;
  note: string;
  isFamily: boolean;
  // 还款交易扩展字段
  sourceAccountId?: number | null; // 还款来源账户 ID
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建交易时的可选属性
export interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    | "id"
    | "familyId"
    | "note"
    | "isFamily"
    | "sourceAccountId"
    | "createdAt"
    | "updatedAt"
  > {}

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  public id!: number;
  public userId!: number;
  public familyId!: number | null;
  public accountId!: number;
  public categoryId!: number;
  public billTypeId!: number;
  public type!: TransactionType;
  public amount!: number;
  public date!: Date;
  public note!: string;
  public isFamily!: boolean;
  // 还款交易扩展字段
  public sourceAccountId?: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
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
    familyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "family_id",
    },
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "account_id",
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "category_id",
    },
    billTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "bill_type_id",
    },
    type: {
      type: DataTypes.ENUM("income", "expense", "repayment"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("amount");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
    },
    isFamily: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_family",
    },
    // 还款交易扩展字段
    sourceAccountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "source_account_id",
    },
  },
  {
    sequelize,
    tableName: "transactions",
    underscored: true,
  }
);

export default Transaction;
