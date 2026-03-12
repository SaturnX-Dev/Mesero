export type Category = string;

export interface DbCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface DbModifier {
  id: string;
  name: string;
  type: string;
  options_json: string;
  max_selections: number;
}

export interface DbPromotion {
  id: string;
  name: string;
  description: string;
  conditions_json: string;
  discount_json: string;
  is_active: number | boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  modifiers?: {
    type: 'list' | 'custom' | 'sauces' | 'mugs' | 'combo' | 'bucket';
    options?: ModifierOption[];
    maxSelections?: number;
    baseSelections?: number;
  }[];
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: {
    name: string;
    value: string | string[];
    extraPrice?: number;
  }[];
  notes?: string;
}

export interface Order {
  tableId: string;
  items: OrderItem[];
  total: number;
}
