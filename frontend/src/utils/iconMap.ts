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
} from "@element-plus/icons-vue";
import type { Component } from "vue";

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

export default iconMap;
