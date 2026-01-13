import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 附件属性接口
export interface AttachmentAttributes {
  id: number;
  transactionId: number | null; // 可为空，支持先上传后关联
  userId: number;
  filename: string; // 原始文件名
  storagePath: string; // 存储路径/key
  mimeType: string; // 文件 MIME 类型
  size: number; // 文件大小（字节）
  thumbnailPath: string | null; // 缩略图路径（图片/视频）
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建附件时的可选属性
export interface AttachmentCreationAttributes
  extends Optional<
    AttachmentAttributes,
    "id" | "transactionId" | "thumbnailPath" | "createdAt" | "updatedAt"
  > {}

class Attachment
  extends Model<AttachmentAttributes, AttachmentCreationAttributes>
  implements AttachmentAttributes
{
  public id!: number;
  public transactionId!: number | null;
  public userId!: number;
  public filename!: string;
  public storagePath!: string;
  public mimeType!: string;
  public size!: number;
  public thumbnailPath!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 判断是否为图片
  public isImage(): boolean {
    return this.mimeType.startsWith("image/");
  }

  // 判断是否为视频
  public isVideo(): boolean {
    return this.mimeType.startsWith("video/");
  }

  // 判断是否为 PDF
  public isPdf(): boolean {
    return this.mimeType === "application/pdf";
  }
}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "transaction_id",
      references: {
        model: "transactions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    storagePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "storage_path",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "mime_type",
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    thumbnailPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "thumbnail_path",
    },
  },
  {
    sequelize,
    tableName: "attachments",
    underscored: true,
    indexes: [{ fields: ["transaction_id"] }, { fields: ["user_id"] }],
  }
);

export default Attachment;
