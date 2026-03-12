import { Product, ModifierOption } from './types';

export const SAUCES: ModifierOption[] = [
  { id: 'pl', name: 'Pimienta Limón' },
  { id: 'ap', name: 'Ajo Parmesano' },
  { id: 'mm', name: 'Miel Mostaza' },
  { id: 'bbq', name: 'BBQ' },
  { id: 'ty', name: 'Teriyaki' },
  { id: 'tam', name: 'Tamarindo' },
  { id: 'bbqh', name: 'BBQ Hot' },
  { id: 'caj', name: 'Cajún' },
  { id: 'ae', name: 'Ajo y Especias' },
  { id: 'br', name: 'Buffalo Ranch' },
  { id: 'buf', name: 'Buffalo' },
  { id: 'tc', name: 'Tamarindo Chipotle' },
  { id: 'eh', name: 'Extra Hot' },
  { id: 'mh', name: 'Mango Habanero' },
  { id: 'sd', name: 'Santa Diabla' },
  { id: 'se', name: 'Santa Enchilada' },
];

export const FROSTING: ModifierOption[] = [
  { id: 'sl', name: 'Sal y Limón' },
  { id: 'ts', name: 'Tamarindo Solo' },
  { id: 'tt', name: 'Tamarindo y Tajín' },
  { id: 'ta', name: 'Tamarindo y Ajonjolí' },
  { id: 'lt', name: 'Limón y Tajín' },
  { id: 'cp', name: 'Clamato Preparado' },
  { id: 'cub', name: 'Cubano' },
];

export const DIPS: ModifierOption[] = [
  { id: 'qa', name: 'Queso Amarillo' },
  { id: 'cat', name: 'Catsup' },
  { id: 'ran', name: 'Ranch' },
  { id: 'rch', name: 'Ranch Chipotle' },
  { id: 'jal', name: 'Jalapeños' },
];

export const BEER_OPTIONS: ModifierOption[] = [
  { id: 'cor', name: 'Corona' },
  { id: 'vic', name: 'Victoria' },
  { id: 'pac', name: 'Pacífico' },
];

export const COMBO_BEER_OPTIONS: ModifierOption[] = [
  { id: 'cor', name: 'Corona' },
  { id: 'vic', name: 'Victoria' },
];

export const WATER_TYPE_OPTIONS: ModifierOption[] = [
  { id: 'nat', name: 'Natural' },
  { id: 'min', name: 'Mineral' },
];

export const ICE_OPTIONS: ModifierOption[] = [
  { id: 'ch', name: 'Con Hielo' },
  { id: 'sh', name: 'Sin Hielo' },
];

export const TEA_OPTIONS: ModifierOption[] = [
  { id: 'tv', name: 'Té Verde' },
  { id: 'tn', name: 'Té Negro' },
  { id: 'td', name: 'Durazno' },
];

export const KIDS_COMBO_OPTIONS: ModifierOption[] = [
  { id: 'k_hamb', name: 'Hamburguesa con papas y jugo' },
  { id: 'k_nug', name: 'Nuggets y jugo' },
];

export const SOFT_DRINKS: ModifierOption[] = [
  { id: 'coke', name: 'Coca Cola' },
  { id: 'coke_zero', name: 'Coca Cola Zero' },
  { id: 'sprite', name: 'Sprite' },
  { id: 'fanta', name: 'Fanta' },
  { id: 'sidral', name: 'Sidral' },
];

export const MENU_DATA: Product[] = [
  // SNACKS
  { id: 's1', name: 'Salchipulpos', description: 'Doraditos trozos de salchicha acompañados con catsup', price: 76, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's2', name: 'Nuggets', description: 'Suavecitos trozos de pollo con cubierta crujiente', price: 87, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's3', name: 'Papas a la Francesa', description: 'Fritas y sazonadas con pimienta-limón de la casa', price: 89, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's4', name: 'Papas Gajo', description: 'Doraditos gajos de papa con corteza, con aderezo ranch', price: 99, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's5', name: 'Aros de Cebolla', description: 'Crujientes aros de cebolla empanizados con aderezo ranch', price: 95, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's6', name: 'Vegetales', description: 'Bastones de apio y zanahoria con aderezo ranch', price: 60, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's7', name: 'Quesipapas', description: 'Bolitas rellenas de papa, queso y jalapeño (12 pz)', price: 119, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 's8', name: "Pa' Compartir", description: 'Alitas 270g + Quesipapas 240g + Salchipulpos 240g + Papas francesas 150g', price: 299, category: 'SNACKS', modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }] },

  // ESPECIALES
  { id: 'e1', name: 'Dedos de Queso', description: 'Palitos de queso mozzarella empanizados con especias (6 pz)', price: 159, category: 'ESPECIALES', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 'e2', name: 'Santas Papitas', description: 'Papas a la francesa bañadas en salsa buffalo-ranch', price: 105, category: 'ESPECIALES', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 'e3', name: 'Papas con Queso/Tocino', description: 'Papas a la francesa con queso cheddar y tocino', price: 115, category: 'ESPECIALES', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 'e4', name: 'Nachos Clásicos', description: 'Totopos con queso amarillo y chile jalapeño', price: 105, category: 'ESPECIALES', modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }] },
  { id: 'e5', name: 'Boneless con Doritos', description: 'Pollo empanizado en salsa buffalo con toque Doritos (500g)', price: 380, category: 'ESPECIALES', modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }] },

  // ALITAS
  { 
    id: 'a1', 
    name: 'Alitas Chica', 
    description: 'Alitas de pollo con salsa a elegir (270g)', 
    price: 130, 
    category: 'ALITAS',
    modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }]
  },
  { 
    id: 'a2', 
    name: 'Alitas Mediana', 
    description: 'Alitas de pollo con salsa a elegir (550g)', 
    price: 205, 
    category: 'ALITAS',
    modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }]
  },
  { 
    id: 'a3', 
    name: 'Alitas Grande', 
    description: 'Alitas de pollo con salsa a elegir (1kg)', 
    price: 350, 
    category: 'ALITAS',
    modifiers: [{ type: 'sauces', baseSelections: 3, options: SAUCES }]
  },

  // BONELESS
  { 
    id: 'b1', 
    name: 'Boneless Chica', 
    description: 'Trozos de pollo empanizado con salsa a elegir (130g)', 
    price: 130, 
    category: 'BONELESS',
    modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }]
  },
  { 
    id: 'b2', 
    name: 'Boneless Mediana', 
    description: 'Trozos de pollo empanizado con salsa a elegir (270g)', 
    price: 205, 
    category: 'BONELESS',
    modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }]
  },
  { 
    id: 'b3', 
    name: 'Boneless Grande', 
    description: 'Trozos de pollo empanizado con salsa a elegir (500g)', 
    price: 350, 
    category: 'BONELESS',
    modifiers: [{ type: 'sauces', baseSelections: 3, options: SAUCES }]
  },
  { id: 'b4', name: 'Dip Extra', description: 'Cualquier salsa o aderezo (2 oz)', price: 10, category: 'BONELESS', modifiers: [{ type: 'list', options: [...SAUCES, ...DIPS] }] },

  // HAMBURGUESAS
  { 
    id: 'h1', 
    name: 'Hamburguesa Tradicional', 
    description: 'Champiñones, tocino, queso, lechuga, jitomate, cebolla y res 150g', 
    price: 195, 
    category: 'HAMBURGUESAS',
    modifiers: [{ type: 'custom' }]
  },
  { 
    id: 'h2', 
    name: 'Hamburguesa De Boneless', 
    description: 'Pechuga 130g empanizada con salsa a elegir, queso, lechuga, jitomate y cebolla', 
    price: 209, 
    category: 'HAMBURGUESAS',
    modifiers: [{ type: 'sauces', baseSelections: 1, options: SAUCES }, { type: 'custom' }]
  },
  { 
    id: 'h3', 
    name: 'Santa Hamburguesa', 
    description: 'Aros de cebolla, tocino, queso amarillo, salsa BBQ y doble carne de res', 
    price: 230, 
    category: 'HAMBURGUESAS',
    modifiers: [{ type: 'custom' }]
  },

  // MICHELADAS
  { 
    id: 'm1', 
    name: 'Michelada Clásica', 
    description: 'Clamato con salsas, varita de tamarindo y cerveza a elección (910ml)', 
    price: 119, 
    category: 'MICHELADAS',
    modifiers: [{ type: 'list', options: BEER_OPTIONS }, { type: 'mugs' }]
  },
  { 
    id: 'm2', 
    name: 'Michelada De Sabor', 
    description: 'Mango, Tamarindo o Mango-Chamoy con varita de tamarindo (910ml)', 
    price: 119, 
    category: 'MICHELADAS',
    modifiers: [{ type: 'mugs' }]
  },
  { 
    id: 'm3', 
    name: 'Santa Miche', 
    description: 'Michelada clásica con pepino, clamato y camarón seco (910ml)', 
    price: 159, 
    category: 'MICHELADAS',
    modifiers: [{ type: 'mugs' }]
  },

  // CERVEZAS
  { id: 'c1', name: 'Coronita Clara', description: 'Ampolleta 210ml', price: 30, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c2', name: 'Victoria Ampolleta', description: 'Ampolleta 210ml', price: 30, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c3', name: 'Cubeta Ampolletas', description: '8 ampolletas a elegir', price: 215, category: 'CERVEZAS', modifiers: [{ type: 'bucket', maxSelections: 8, options: BEER_OPTIONS }] },
  { id: 'c4', name: 'Corona Clara 355ml', description: 'Nacional 355ml', price: 50, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c5', name: 'Victoria 355ml', description: 'Nacional 355ml', price: 50, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c6', name: 'León 355ml', description: 'Nacional 355ml', price: 50, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c7', name: 'Pacífico 355ml', description: 'Nacional 355ml', price: 52, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c8', name: 'Negra Modelo', description: 'Premium 355ml', price: 59, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c9', name: 'Modelo Especial', description: 'Premium 355ml', price: 59, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c10', name: 'Michelob Ultra', description: 'Internacional 355ml', price: 59, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c11', name: 'Stella Artois', description: 'Internacional 330ml', price: 75, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c12', name: 'Victoria Mega 1.2Lt', description: 'Mega 1.2Lt', price: 119, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c13', name: 'Corona Mega 1.2Lt', description: 'Mega 1.2Lt', price: 119, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c14', name: 'León Mega 1.2Lt', description: 'Mega 1.2Lt', price: 119, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c15', name: 'Pacífico Mega 1.2Lt', description: 'Mega 1.2Lt', price: 125, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c16', name: 'Modelo Especial 1Lt', description: 'Mega 1Lt', price: 125, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },
  { id: 'c17', name: 'Negra Modelo 1Lt', description: 'Mega 1Lt', price: 125, category: 'CERVEZAS', modifiers: [{ type: 'mugs' }] },

  // SIN ALCOHOL
  { id: 'sa1', name: 'Refresco', description: 'Variedad de sabores', price: 45, category: 'SIN ALCOHOL', modifiers: [{ type: 'list', options: SOFT_DRINKS }, { type: 'list', options: ICE_OPTIONS }] },
  { id: 'sa2', name: 'Limonada', description: 'Natural o Mineral', price: 45, category: 'SIN ALCOHOL', modifiers: [{ type: 'list', options: WATER_TYPE_OPTIONS }, { type: 'list', options: ICE_OPTIONS }] },
  { id: 'sa3', name: 'Naranjada', description: 'Natural o Mineral', price: 45, category: 'SIN ALCOHOL', modifiers: [{ type: 'list', options: WATER_TYPE_OPTIONS }, { type: 'list', options: ICE_OPTIONS }] },
  { id: 'sa4', name: 'Té Helado', description: 'Vaso', price: 45, category: 'SIN ALCOHOL', modifiers: [{ type: 'list', options: TEA_OPTIONS }, { type: 'list', options: ICE_OPTIONS }] },
  { id: 'sa5', name: 'Rusa de Refresco', description: 'Preparado con sal y limón', price: 45, category: 'SIN ALCOHOL' },
  { id: 'sa6', name: 'Agua Mineral', description: 'Botella', price: 45, category: 'SIN ALCOHOL' },
  { id: 'sa7', name: 'Corona Cero', description: 'Cerveza sin alcohol', price: 45, category: 'SIN ALCOHOL' },
  { id: 'sa8', name: 'Clamato Preparado', description: 'Sin alcohol', price: 32, category: 'SIN ALCOHOL' },
  { id: 'sa9', name: 'Agua Natural', description: 'Botella', price: 39, category: 'SIN ALCOHOL' },

  // POSTRES Y CAFÉ
  { id: 'pc1', name: 'Café', description: 'Café de la casa (250ml)', price: 45, category: 'POSTRES Y CAFÉ' },
  { id: 'pc2', name: 'Postres', description: 'Preguntar disponibilidad', price: 0, category: 'POSTRES Y CAFÉ' },

  // COMBOS
  { 
    id: 'co1', 
    name: 'Santo Combo', 
    description: 'Hamburguesa + papas + cerveza nacional o refresco', 
    price: 169, 
    category: 'COMBOS',
    modifiers: [{ type: 'list', options: [...BEER_OPTIONS, ...SOFT_DRINKS] }, { type: 'custom' }]
  },
  { 
    id: 'co2', 
    name: "Combo Kid's", 
    description: 'Hamburguesa o Nuggets + papas + jugo', 
    price: 109, 
    category: 'COMBOS',
    modifiers: [{ type: 'list', options: KIDS_COMBO_OPTIONS }]
  },
  { 
    id: 'co3', 
    name: 'Combo 1 - Clásico', 
    description: 'Alitas 550g + 8 Cervezas Ampolleta', 
    price: 545, 
    category: 'COMBOS',
    modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }, { type: 'bucket', maxSelections: 8, options: COMBO_BEER_OPTIONS }, { type: 'mugs' }]
  },
  { 
    id: 'co4', 
    name: 'Combo 2 - Pareja', 
    description: 'Alitas 550g + papas + 2 Cervezas Nacionales', 
    price: 355, 
    category: 'COMBOS',
    modifiers: [{ type: 'sauces', baseSelections: 2, options: SAUCES }, { type: 'bucket', maxSelections: 2, options: COMBO_BEER_OPTIONS }]
  },
  { 
    id: 'co5', 
    name: 'Combo 3 - Compas', 
    description: 'Alitas 1kg + Papas Gajo + Papas Francesas + 8 Cervezas Nacionales', 
    price: 845, 
    category: 'COMBOS',
    modifiers: [{ type: 'sauces', baseSelections: 3, options: SAUCES }, { type: 'bucket', maxSelections: 8, options: COMBO_BEER_OPTIONS }, { type: 'mugs' }]
  },

  // DIPS
  { id: 'd1', name: 'Salsa o Dip Extra', description: 'Porción extra de 2 oz', price: 10, category: 'DIPS', modifiers: [{ type: 'list', options: [...SAUCES, ...DIPS] }] },
];
