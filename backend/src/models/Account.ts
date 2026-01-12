import {
  DataTypes,
  Model,
  Optional,
  Transaction as SequelizeTransaction,
} from "sequelize";
import sequelize from "../config/database";
import type { AccountType } from "../types";

// 账户属性接口
interface AccountAttributes {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  // 信用账户扩展字段
  creditLimit?: number; // 信用额度
  billingDay?: number; // 账单日 (1-28)
  dueDay?: number; // 还款日 (1-28)
  createdAt?: Date;
}

// 创建账户时可选的属性
interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | "id"
    | "balance"
    | "icon"
    | "creditLimit"
    | "billingDay"
    | "dueDay"
    | "createdAt"
  > {}

// 账户模型类
class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public type!: AccountType;
  public balance!: number;
  public icon?: string;
  // 信用账户扩展字段
  public creditLimit?: number;
  public billingDay?: number;
  public dueDay?: number;
  public readonly createdAt!: Date;

  // 更新余额（支持事务）
  public async updateBalance(
    amount: number,
    transaction?: SequelizeTransaction
  ): Promise<void> {
    this.balance = Number(this.balance) + Number(amount);
    await this.save({ transaction });
  }

  // 判断是否为信用账户
  public isCreditAccount(): boolean {
    return this.type === "credit";
  }
}

Account.init(
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
    type: {
      type: DataTypes.ENUM(
        "cash",
        "bank",
        "alipay",
        "wechat",
        "credit",
        "other"
      ),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue("balance");
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // 信用账户扩展字段
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "credit_limit",
      get() {
        const value = this.getDataValue("creditLimit");
        return value ? parseFloat(value.toString()) : undefined;
      },
    },
    billingDay: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "billing_day",
      validate: {
        min: 1,
        max: 28,
      },
    },
    dueDay: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "due_day",
      validate: {
        min: 1,
        max: 28,
      },
    },
  },
  {
    sequelize,
    tableName: "accounts",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default Account;
