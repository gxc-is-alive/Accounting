import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";

// 用户属性接口
interface UserAttributes {
  id: number;
  email: string;
  password: string;
  nickname: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建用户时可选的属性
interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

// 用户模型类
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public nickname!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 验证密码
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // 转换为 JSON 时隐藏密码
  public toJSON(): Omit<UserAttributes, "password"> {
    const values = { ...this.get() };
    delete (values as Partial<UserAttributes>).password;
    return values as Omit<UserAttributes, "password">;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true,
    hooks: {
      // 创建前加密密码
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // 更新前加密密码（如果密码被修改）
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
