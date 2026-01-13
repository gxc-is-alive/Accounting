/**
 * 分类图标映射
 * 将数据库中的 icon 字段映射到 Element Plus 图标组件
 */
import {
  Bowl,
  Coffee,
  Lollipop,
  Apple,
  ShoppingCart,
  Van,
  Bicycle,
  Location,
  Goods,
  ShoppingBag,
  Brush,
  Cellphone,
  House,
  OfficeBuilding,
  Sunny,
  Lightning,
  Cloudy,
  Connection,
  Phone,
  VideoCamera,
  Film,
  Headset,
  Trophy,
  Suitcase,
  Ticket,
  FirstAidKit,
  Reading,
  Notebook,
  Collection,
  Present,
  Money,
  CreditCard,
  Coin,
  Wallet,
  Briefcase,
  Medal,
  TrendCharts,
  DataLine,
  Box,
  Folder,
  Document,
  More,
  Postcard,
  Promotion,
  ChatDotRound,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import type { Account, AccountType } from "@/types";

// 图标映射表
export const iconMap: Record<string, Component> = {
  // 餐饮类
  food: Bowl,
  breakfast: Coffee,
  lunch: Bowl,
  dinner: Bowl,
  takeaway: ShoppingCart,
  snack: Lollipop,
  fruit: Apple,
  vegetable: ShoppingCart,

  // 交通类
  car: Van,
  subway: Location,
  taxi: Van,
  bike: Bicycle,
  fuel: Sunny,
  parking: Location,
  "car-service": Van,
  train: Van,
  flight: Van,

  // 购物类
  shopping: ShoppingBag,
  "daily-use": Goods,
  clothes: Brush,
  digital: Cellphone,
  furniture: House,
  cosmetics: Present,
  baby: Present,
  pet: Present,

  // 居住类
  home: House,
  rent: OfficeBuilding,
  mortgage: OfficeBuilding,
  "property-fee": OfficeBuilding,
  water: Cloudy,
  electricity: Lightning,
  gas: Sunny,
  heating: Sunny,
  internet: Connection,
  housekeeping: House,

  // 通讯类
  phone: Phone,
  "phone-bill": Phone,
  subscription: VideoCamera,

  // 娱乐类
  game: Headset,
  movie: Film,
  gaming: Headset,
  fitness: Trophy,
  travel: Suitcase,
  ktv: Headset,
  ticket: Ticket,

  // 医疗类
  medical: FirstAidKit,
  hospital: FirstAidKit,
  medicine: FirstAidKit,
  checkup: FirstAidKit,
  "health-product": FirstAidKit,

  // 教育类
  book: Reading,
  books: Reading,
  course: Notebook,
  tuition: Collection,
  exam: Notebook,

  // 人情类
  gift: Present,
  "red-packet": Money,
  "gift-money": Money,
  treat: Bowl,
  present: Present,

  // 金融类
  finance: TrendCharts,
  insurance: Briefcase,
  "credit-repay": CreditCard,
  "loan-repay": CreditCard,
  fee: Coin,

  // 收入类
  salary: Wallet,
  bonus: Medal,
  overtime: Wallet,
  "annual-bonus": Medal,
  performance: Medal,
  allowance: Wallet,
  parttime: Briefcase,
  manuscript: Document,
  consulting: Briefcase,
  outsource: Briefcase,
  invest: TrendCharts,
  stock: DataLine,
  fund: TrendCharts,
  interest: Coin,
  dividend: Coin,
  rental: House,
  redpacket: Money,
  reimbursement: Money,
  refund: Money,
  lottery: Medal,
  secondhand: Box,

  // 账单类型
  daily: ShoppingCart,
  fixed: OfficeBuilding,
  social: Present,
  online: Cellphone,
  offline: ShoppingBag,
  transport: Van,
  education: Reading,
  entertainment: Film,
  sidejob: Briefcase,
  transfer: CreditCard,

  // 默认
  default: Folder,
  other: More,
};

/**
 * 获取图标组件
 * @param iconName 图标名称
 * @returns Element Plus 图标组件
 */
export function getIconComponent(
  iconName: string | undefined | null
): Component {
  if (!iconName) return Folder;
  return iconMap[iconName] || Folder;
}

// 账户类型图标映射
export const accountTypeIconMap: Record<AccountType, Component> = {
  cash: Wallet,
  bank: CreditCard,
  alipay: Promotion,
  wechat: ChatDotRound,
  credit: Postcard,
  investment: TrendCharts,
  other: More,
};

/**
 * 获取账户图标组件
 * 优先使用账户自定义图标，否则使用账户类型默认图标
 * @param account 账户对象
 * @returns Element Plus 图标组件
 */
export function getAccountIcon(account: Account): Component {
  // 优先使用自定义图标
  if (account.icon && iconMap[account.icon]) {
    return iconMap[account.icon];
  }
  // 使用账户类型默认图标
  return accountTypeIconMap[account.type] || Wallet;
}

/**
 * 获取账户图标名称
 * 优先使用账户自定义图标名称，否则返回账户类型
 * @param account 账户对象
 * @returns 图标名称字符串
 */
export function getAccountIconName(account: Account): string {
  if (account.icon) {
    return account.icon;
  }
  return account.type;
}

export default iconMap;
