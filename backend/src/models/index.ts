import User from "./User";
import TokenBlacklist from "./TokenBlacklist";
import Account from "./Account";
import Category from "./Category";
import Transaction from "./Transaction";
import Family from "./Family";
import FamilyMember from "./FamilyMember";
import FamilyInvite from "./FamilyInvite";
import Budget from "./Budget";
import Attachment from "./Attachment";
import Valuation from "./Valuation";

// 定义模型关联
User.hasMany(Account, { foreignKey: "userId", as: "accounts" });
Account.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Category, { foreignKey: "userId", as: "categories" });
Category.belongsTo(User, { foreignKey: "userId", as: "user" });

Category.hasMany(Category, { foreignKey: "parentId", as: "children" });
Category.belongsTo(Category, { foreignKey: "parentId", as: "parent" });

User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });

Account.hasMany(Transaction, { foreignKey: "accountId", as: "transactions" });
Transaction.belongsTo(Account, { foreignKey: "accountId", as: "account" });

Category.hasMany(Transaction, { foreignKey: "categoryId", as: "transactions" });
Transaction.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

User.hasMany(Family, { foreignKey: "createdBy", as: "createdFamilies" });
Family.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Family.hasMany(FamilyMember, { foreignKey: "familyId", as: "members" });
FamilyMember.belongsTo(Family, { foreignKey: "familyId", as: "family" });
User.hasMany(FamilyMember, { foreignKey: "userId", as: "familyMemberships" });
FamilyMember.belongsTo(User, { foreignKey: "userId", as: "user" });

Family.hasMany(FamilyInvite, { foreignKey: "familyId", as: "invites" });
FamilyInvite.belongsTo(Family, { foreignKey: "familyId", as: "family" });

Family.hasMany(Transaction, { foreignKey: "familyId", as: "transactions" });
Transaction.belongsTo(Family, { foreignKey: "familyId", as: "family" });

User.hasMany(Budget, { foreignKey: "userId", as: "budgets" });
Budget.belongsTo(User, { foreignKey: "userId", as: "user" });
Category.hasMany(Budget, { foreignKey: "categoryId", as: "budgets" });
Budget.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

// 附件关联
Transaction.hasMany(Attachment, {
  foreignKey: "transactionId",
  as: "attachments",
});
Attachment.belongsTo(Transaction, {
  foreignKey: "transactionId",
  as: "transaction",
});
User.hasMany(Attachment, { foreignKey: "userId", as: "attachments" });
Attachment.belongsTo(User, { foreignKey: "userId", as: "user" });

// 估值记录关联（投资追踪）
Account.hasMany(Valuation, { foreignKey: "accountId", as: "valuations" });
Valuation.belongsTo(Account, { foreignKey: "accountId", as: "account" });

// 导出所有模型
export {
  User,
  TokenBlacklist,
  Account,
  Category,
  Transaction,
  Family,
  FamilyMember,
  FamilyInvite,
  Budget,
  Attachment,
  Valuation,
};
