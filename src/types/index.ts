export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  date: any;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Due' | 'Partial';
  createdBy: string;
}

export interface ShortlistItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
  isDone: boolean;
  createdAt: any;
}
