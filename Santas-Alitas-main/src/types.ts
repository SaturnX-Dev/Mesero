export type Category = 
  | 'SNACKS' 
  | 'ESPECIALES' 
  | 'ALITAS' 
  | 'BONELESS' 
  | 'DIPS'
  | 'HAMBURGUESAS' 
  | 'MICHELADAS' 
  | 'POSTRES Y CAFÉ' 
  | 'CERVEZAS' 
  | 'SIN ALCOHOL' 
  | 'COMBOS';

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
