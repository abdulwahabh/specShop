
export type Category = string;

export enum SaleStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Supplier {
  id: string;
  name: string;
  mobile: string;
  address: string;
}

export interface SaleItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCostPrice: number; // Captured at time of sale
  subTotal: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  description?: string;
}

export interface Sale {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerMobile: string;
  customerPlace: string;
  items: SaleItem[];
  subTotal: number;
  discount: number;
  totalPrice: number;
  advancePaid: number;
  balance: number;
  status: SaleStatus;
  date: string;
}

export interface MonthlyReport {
  month: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  stockLevel: number;
}
