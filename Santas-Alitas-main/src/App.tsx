import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Moon,
  Sun,
  Palette,
  DoorOpen,
  ClipboardList,
  UtensilsCrossed,
  CheckCircle2,
  ChevronLeft,
  LayoutGrid,
  Map as MapIcon,
  Settings,
  Save,
  PlusCircle,
  History,
  CreditCard,
  DollarSign,
  Clock,
  Beer,
  ChefHat
} from 'lucide-react';
import { SAUCES, FROSTING, SOFT_DRINKS, DIPS, BEER_OPTIONS, ICE_OPTIONS, WATER_TYPE_OPTIONS, TEA_OPTIONS } from './data';
import { Product, OrderItem, Category } from './types';
import LOGO_URL from './assets/santas-alitas-logo.svg';

const CATEGORIES: (Category | 'TODOS')[] = [
  'TODOS', 'SNACKS', 'ESPECIALES', 'ALITAS', 'BONELESS', 'DIPS', 'HAMBURGUESAS', 
  'MICHELADAS', 'CERVEZAS', 'SIN ALCOHOL', 'COMBOS', 'POSTRES Y CAFÉ'
];

const ACCENT_COLORS = [
  { name: 'Naranja', value: '#ea580c', class: 'orange' },
  { name: 'Rojo', value: '#dc2626', class: 'red' },
  { name: 'Azul', value: '#2563eb', class: 'blue' },
  { name: 'Verde', value: '#16a34a', class: 'green' },
  { name: 'Morado', value: '#9333ea', class: 'purple' },
  { name: 'Rosa', value: '#db2777', class: 'pink' },
  { name: 'Cian', value: '#0891b2', class: 'cyan' },
  { name: 'Esmeralda', value: '#059669', class: 'emerald' },
];

function useLongPress(onLongPress: (e: any) => void, onClick: () => void, ms = 500) {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timerId: any;
    if (startLongPress) {
      timerId = setTimeout(() => {
        onLongPress(null);
        setStartLongPress(false);
      }, ms);
    } else {
      clearTimeout(timerId);
    }

    return () => clearTimeout(timerId);
  }, [startLongPress, onLongPress, ms]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => {
      if (startLongPress) {
        onClick();
      }
      setStartLongPress(false);
    },
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => {
      if (startLongPress) {
        onClick();
      }
      setStartLongPress(false);
    },
    onContextMenu: (e: any) => {
      e.preventDefault();
      onLongPress(e);
    }
  };
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isOrderViewOpen, setIsOrderViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOrderSent, setShowOrderSent] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClosingAccount, setIsClosingAccount] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Customization State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accentColor, setAccentColor] = useState('#ea580c');
  const [isDousonMode, setIsDousonMode] = useState(false);
  const settingsLoaded = React.useRef(false);
  const menuReady = React.useRef(false);
  
  // Data from API
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<{id: string, x: number, y: number, isOccupied: boolean, alias?: string}[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [editingOrderItem, setEditingOrderItem] = useState<any>(null);

  useEffect(() => {
    // Load settings from DB
    fetch('/api/settings').then(r => r.json()).then((s: Record<string, string>) => {
      if (s.theme) setTheme(s.theme as 'light' | 'dark');
      if (s.accentColor) setAccentColor(s.accentColor);
      if (s.isDousonMode) setIsDousonMode(s.isDousonMode === 'true');
      // Apply immediately
      document.documentElement.classList.toggle('dark', (s.theme || 'light') === 'dark');
      document.documentElement.style.setProperty('--accent-color', s.accentColor || '#ea580c');
      settingsLoaded.current = true;
    }).catch(() => { settingsLoaded.current = true; });
  }, []);

  const saveSetting = (key: string, value: string) => {
    if (!settingsLoaded.current) return;
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).catch(() => {});
  };

  useEffect(() => {
    saveSetting('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    saveSetting('accentColor', accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    saveSetting('isDousonMode', String(isDousonMode));
  }, [isDousonMode]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setActiveCategory('TODOS');
      setSearchTerm('');
      fetchActiveOrder(selectedTable);
      menuReady.current = false;
      setTimeout(() => { menuReady.current = true; }, 400);
    } else {
      setActiveOrder(null);
    }
  }, [selectedTable]);

  const fetchData = async () => {
    try {
      const [prodRes, tableRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/tables')
      ]);
      const [prodData, tableData] = await Promise.all([
        prodRes.json(),
        tableRes.json()
      ]);
      setProducts(prodData);
      setTables(tableData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchActiveOrder = async (tableId: string) => {
    try {
      const res = await fetch(`/api/orders/active/${tableId}`);
      const data = await res.json();
      setActiveOrder(data);
    } catch (error) {
      console.error("Error fetching active order:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const addTable = async () => {
    const id = prompt("Número de mesa:");
    if (!id) return;
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, x: 50, y: 50 })
    });
    fetchData();
  };

  const migrateTable = async (fromId: string) => {
    const toId = prompt(`Migrar mesa ${fromId} a la mesa:`);
    if (!toId || toId === fromId) return;

    try {
      const res = await fetch('/api/orders/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromTableId: fromId, toTableId: toId })
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al migrar mesa");
        return;
      }

      fetchData();
    } catch (error) {
      console.error("Error migrating table:", error);
    }
  };

  const renameTable = async (tableId: string) => {
    const currentAlias = tables.find(t => t.id === tableId)?.alias || '';
    const alias = prompt(`Alias para mesa ${tableId} (dejar vacío para quitar):`, currentAlias);
    if (alias === null) return; // cancelled
    if (alias && !/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(alias.trim())) {
      alert('El alias solo puede contener letras.');
      return;
    }
    try {
      await fetch('/api/tables/alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, alias: alias.trim() || null })
      });
      fetchData();
    } catch (error) {
      console.error("Error setting alias:", error);
    }
  };

  const deleteTable = async (id: string) => {
    if (!confirm(`¿Eliminar mesa ${id}?`)) return;
    await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // Group and sort tables for the map layout
  const tableGroups = useMemo(() => {
    const groups: Record<string, typeof tables> = {
      '40s': [],
      '30s': [],
      '20s': [],
      '10s': [],
    };

    tables.forEach(t => {
      const prefix = t.id.charAt(0);
      if (prefix === '4') groups['40s'].push(t);
      else if (prefix === '3') groups['30s'].push(t);
      else if (prefix === '2') groups['20s'].push(t);
      else if (prefix === '1') groups['10s'].push(t);
    });

    // Sort within groups
    Object.values(groups).forEach(g => g.sort((a, b) => a.id.localeCompare(b.id)));

    // Return in order: 40s, 30s, 20s, 10s (reversed as requested)
    return [
      { id: '40s', tables: groups['40s'] },
      { id: '30s', tables: groups['30s'] },
      { id: '20s', tables: groups['20s'] },
      { id: '10s', tables: groups['10s'] },
    ];
  }, [tables]);

  // Filtered products based on search or category
  const filteredProducts = useMemo(() => {
    if (searchTerm.trim()) {
      return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeCategory === 'TODOS') return products;
    return products.filter(p => p.category === activeCategory);
  }, [searchTerm, activeCategory, products]);

  const addToOrder = async (product: Product, modifiers: any[] = [], notes: string = '') => {
    if (!selectedTable) return;
    
    const orderItemId = Math.random().toString(36).substr(2, 9);
    const newItem = {
      orderItemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      modifiers,
      notes
    };

    try {
      await fetch('/api/orders/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: selectedTable, item: newItem })
      });
      
      await fetchActiveOrder(selectedTable);
      await fetchData(); // Update table occupancy
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error adding to order:", error);
    }
  };

  const updateQuantity = async (orderItemId: string, delta: number) => {
    if (!activeOrder) return;
    const item = activeOrder.items.find((i: any) => i.id === orderItemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    try {
      await fetch('/api/orders/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: activeOrder.id, 
          orderItemId, 
          quantity: newQty 
        })
      });
      await fetchActiveOrder(selectedTable!);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const updateOrderItemDetails = async (orderItemId: string, modifiers: any[], notes: string) => {
    if (!activeOrder) return;
    try {
      await fetch('/api/orders/update-item-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          orderItemId,
          modifiers,
          notes
        })
      });
      await fetchActiveOrder(selectedTable!);
    } catch (error) {
      console.error("Error updating item details:", error);
    }
  };

  const removeFromOrder = async (orderItemId: string) => {
    if (!activeOrder) return;
    try {
      await fetch('/api/orders/remove-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: activeOrder.id, 
          orderItemId 
        })
      });
      await fetchActiveOrder(selectedTable!);
      await fetchData(); // Update table occupancy if order becomes empty
    } catch (error) {
      console.error("Error removing from order:", error);
    }
  };

  const closeAccount = async (total: number, tip: number, tipPercent: number) => {
    if (!activeOrder) return;
    
    try {
      await fetch('/api/orders/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: activeOrder.id, 
          total, 
          tip, 
          tipPercent 
        })
      });
      
      setIsClosingAccount(false);
      setIsOrderViewOpen(false);
      setSelectedTable(null);
      fetchData();
    } catch (error) {
      console.error("Error closing account:", error);
    }
  };

  const total = activeOrder?.items?.reduce((sum: number, item: any) => {
    const modifierExtra = item.modifiers.reduce((mSum: number, m: any) => mSum + (m.extraPrice || 0), 0);
    return sum + (item.price + modifierExtra) * item.quantity;
  }, 0) || 0;

  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category) return;
    
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct)
    });
    setEditingProduct(null);
    fetchData();
  };

  if (!selectedTable) {
    return (
      <div className={`min-h-screen flex flex-col p-4 sm:p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'}`}>
        <header className={`flex flex-col items-center p-6 sm:p-10 border-b transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <img 
            src={LOGO_URL} 
            alt="Santas Alitas" 
            className="w-48 sm:w-64 h-auto object-contain drop-shadow-lg mt-8"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/restaurant/200/200";
            }}
          />
        </header>

        <div className={`flex-1 max-w-5xl mx-auto w-full rounded-[2rem] shadow-2xl p-4 sm:p-8 border relative overflow-hidden flex flex-col mb-24 transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          <div className={`flex-1 min-h-[500px] rounded-3xl border-4 shadow-inner overflow-y-auto overflow-x-hidden p-4 sm:p-6 transition-colors ${theme === 'dark' ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
            <div className="grid gap-3 sm:gap-4 w-full" style={{ gridTemplateColumns: `repeat(${tableGroups.length}, 1fr)` }}>
              {tableGroups.map((group, index) => (
                <div key={group.id} className="flex flex-col gap-3 sm:gap-4">
                  {index === 0 && (
                    <div className="w-full flex items-center justify-center">
                      <div className={`w-full aspect-square rounded-[1.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'}`}>
                        <DoorOpen className="w-5 h-5 sm:w-6 sm:h-6 text-stone-400" />
                        <span className="font-black text-stone-400 text-[7px] sm:text-[8px] uppercase tracking-widest leading-none">Entrada</span>
                      </div>
                    </div>
                  )}
                  {group.tables.map((table) => (
                    <TableButton 
                      key={table.id}
                      table={table}
                      isAdminMode={isAdminMode}
                      isDousonMode={isDousonMode}
                      theme={theme}
                      onDelete={() => deleteTable(table.id)}
                      onSelect={() => setSelectedTable(table.id)}
                      onMigrate={() => migrateTable(table.id)}
                      onRename={() => renameTable(table.id)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Barra and Cocina at the bottom */}
            <div className="mt-12 space-y-4">
              <div className={`w-full h-20 rounded-2xl border-4 flex items-center justify-center gap-3 shadow-xl transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-800 border-stone-700'}`}>
                <Beer className="w-6 h-6 text-accent" />
                <span className="font-black text-white text-sm uppercase tracking-[0.3em]">Barra Principal</span>
              </div>
              <div className={`w-full h-24 rounded-2xl border-4 flex items-center justify-center gap-3 border-dashed transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-stone-200 border-stone-300'}`}>
                <ChefHat className="w-8 h-8 text-stone-400" />
                <span className="font-black text-stone-400 text-sm uppercase tracking-[0.3em]">Cocina</span>
              </div>
            </div>
          </div>

          {isAdminMode && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button 
                onClick={addTable}
                className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                Agregar Mesa
              </button>
              <button 
                onClick={() => setIsProductManagerOpen(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all ${theme === 'dark' ? 'bg-stone-700 text-white hover:bg-stone-600' : 'bg-stone-800 text-white hover:bg-stone-900'}`}
              >
                <LayoutGrid className="w-5 h-5" />
                Gestionar Menú
              </button>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-stone-400 text-xs font-medium uppercase tracking-widest">
          Santas Alitas Plaza Legaria • Sistema de Meseros v1.0 • En memoria de Douson
        </footer>

        {/* Bottom Navigation for Tables View */}
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t pb-safe transition-colors ${theme === 'dark' ? 'bg-stone-900/90 border-stone-800 backdrop-blur-md' : 'bg-white/90 border-stone-200 backdrop-blur-md'}`}>
          <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
            <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>Mapa de Mesas</h1>
            <div className="flex gap-2">
              <button 
                onClick={fetchHistory}
                className={`p-3 rounded-2xl transition-colors shadow-sm ${theme === 'dark' ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                <History className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-3 rounded-2xl transition-colors shadow-sm ${isSettingsOpen ? 'bg-accent text-white' : theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}
              >
                <Settings className="w-6 h-6" />
              </button>
              {isAdminMode && (
                <button 
                  onClick={() => setIsAdminMode(false)}
                  className="p-3 rounded-2xl bg-red-600 text-white shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Configuración</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Tema</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-accent bg-accent/5' : 'border-stone-100 dark:border-stone-800'}`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="font-bold">Claro</span>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-accent bg-accent/5' : 'border-stone-100 dark:border-stone-800'}`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="font-bold">Oscuro</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Color de Acento</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {ACCENT_COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setAccentColor(color.value)}
                          className={`aspect-square rounded-xl border-4 transition-all ${accentColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Modos Especiales</h3>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800">
                      <div className="flex flex-col">
                        <span className="font-bold">Modo Douson</span>
                        <span className="text-[10px] text-stone-400 uppercase font-black">Renombrar mesas al dejar presionado</span>
                      </div>
                      <button 
                        onClick={() => setIsDousonMode(!isDousonMode)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isDousonMode ? 'bg-accent' : 'bg-stone-300 dark:bg-stone-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDousonMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800">
                      <div className="flex flex-col">
                        <span className="font-bold">Modo Administrador</span>
                        <span className="text-[10px] text-stone-400 uppercase font-black">Gestionar mesas y productos</span>
                      </div>
                      <button 
                        onClick={() => setIsAdminMode(!isAdminMode)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isAdminMode ? 'bg-red-600' : 'bg-stone-300 dark:bg-stone-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAdminMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Product Manager Modal */}
        <AnimatePresence>
          {isProductManagerOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${theme === 'dark' ? 'bg-stone-900' : 'bg-white'} w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl`}
              >
                <div className={`p-6 border-b flex justify-between items-center z-10 ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-800'}`}>Gestión de Menú</h2>
                  <button onClick={() => setIsProductManagerOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-stone-100 hover:bg-stone-200'}`}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {editingProduct ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">Nombre</label>
                          <input 
                            value={editingProduct.name || ''} 
                            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                            className={`w-full rounded-xl p-3 outline-none border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">Precio ($)</label>
                          <input 
                            type="number"
                            value={editingProduct.price || ''} 
                            onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                            className={`w-full rounded-xl p-3 outline-none border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">Categoría</label>
                        <select 
                          value={editingProduct.category || ''} 
                          onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                          className={`w-full rounded-xl p-3 outline-none border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'}`}
                        >
                          <option value="">Seleccionar...</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">Descripción</label>
                        <textarea 
                          value={editingProduct.description || ''} 
                          onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                          className={`w-full rounded-xl p-3 outline-none border transition-colors min-h-[70px] ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'}`}
                        />
                      </div>

                      {/* Modifier Linker */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase block">Modificadores enlazados</label>
                        <div className={`rounded-2xl border p-3 space-y-2 ${theme === 'dark' ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-stone-50'}`}>
                          {(editingProduct.modifiers || []).map((mod: any, idx: number) => (
                            <div key={idx} className={`flex items-center justify-between p-2 rounded-xl text-sm ${theme === 'dark' ? 'bg-stone-700 text-stone-200' : 'bg-white border border-stone-200'}`}>
                              <div>
                                <span className="font-bold capitalize">{mod.type}</span>
                                {mod.baseSelections !== undefined && <span className="text-stone-400 ml-2">(base: {mod.baseSelections})</span>}
                                {mod.maxSelections !== undefined && <span className="text-stone-400 ml-2">(máx: {mod.maxSelections})</span>}
                                {mod.options && <span className="text-stone-400 ml-2">· {mod.options.length} ops</span>}
                              </div>
                              <button type="button" onClick={() => {
                                const mods = [...(editingProduct.modifiers || [])];
                                mods.splice(idx, 1);
                                setEditingProduct({...editingProduct, modifiers: mods});
                              }} className="text-red-400 hover:text-red-600 p-1"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {[['Salsas/Dips', 'accent', () => [{type:'sauces',baseSelections:1,options:SAUCES}]],
                              ['Tarros/Escarchado', 'accent', () => [{type:'mugs'}]],
                              ['Cubeta Cervezas', 'accent', () => [{type:'bucket',maxSelections:6,options:BEER_OPTIONS}]],
                              ['Lista Cervezas', 'accent', () => [{type:'list',options:BEER_OPTIONS}]],
                              ['Hielo', 'sky', () => [{type:'list',options:ICE_OPTIONS}]],
                              ['Natural/Mineral', 'sky', () => [{type:'list',options:WATER_TYPE_OPTIONS}]],
                              ['Sabor Té', 'emerald', () => [{type:'list',options:TEA_OPTIONS}]],
                              ['Sabor Refresco', 'purple', () => [{type:'list',options:SOFT_DRINKS}]],
                            ].map(([label, color, getModsFn]: any) => (
                              <button key={label as string} type="button" onClick={() => {
                                const mods = [...(editingProduct.modifiers || []), ...getModsFn()];
                                setEditingProduct({...editingProduct, modifiers: mods});
                              }} className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 border-transparent transition-all hover:border-accent hover:text-accent ${theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-white border-stone-200 text-stone-600 shadow-sm'}`}>
                                + {label as string}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className={`flex-1 py-3 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="button"
                          onClick={saveProduct}
                          className="flex-1 bg-accent text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
                        >
                          <Save className="w-5 h-5" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button 
                        onClick={() => setEditingProduct({})}
                        className={`w-full py-4 border-2 border-dashed rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${theme === 'dark' ? 'border-stone-700 text-stone-500 hover:border-accent hover:text-accent' : 'border-stone-200 text-stone-400 hover:border-accent hover:text-accent'}`}
                      >
                        <Plus className="w-5 h-5" />
                        Nuevo Producto
                      </button>
                      <div className="grid gap-2">
                        {products.map(p => (
                          <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'}`}>
                            <div>
                              <p className={`font-bold ${theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>{p.name}</p>
                              <p className="text-[10px] text-stone-400 uppercase font-bold">{p.category} • ${p.price}</p>
                            </div>
                            <button 
                              onClick={() => setEditingProduct(p)}
                              className={`p-2 transition-colors ${theme === 'dark' ? 'text-stone-500 hover:text-accent' : 'text-stone-400 hover:text-accent'}`}
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'} font-sans flex flex-col pb-24`}>
      {/* Top Header Logo (Only logo, search bar removed from here) */}
      <header className={`border-b sticky top-0 z-30 shadow-sm transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} p-4 flex justify-center`}>
        <img 
          src={LOGO_URL} 
          alt="Santas Alitas" 
          onClick={() => {
            setSelectedTable(null);
            setActiveCategory('TODOS');
            setSearchTerm('');
          }}
          className="w-40 sm:w-48 h-auto object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://picsum.photos/seed/restaurant/200/200";
          }}
        />
      </header>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className={`border-b sticky top-[72px] sm:top-[88px] z-20 overflow-x-auto no-scrollbar transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          <div className="flex p-2 gap-2 min-w-max max-w-2xl mx-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat 
                    ? 'bg-accent text-white shadow-md' 
                    : theme === 'dark' ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="grid gap-4">
          {filteredProducts.map(product => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              onClick={() => {
                if (!menuReady.current) return;
                setSelectedProduct(product);
              }}
              className={`p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}
            >
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>{product.name}</h3>
                <p className="text-stone-500 text-sm line-clamp-2 mt-1">{product.description}</p>
                <span className="text-accent font-bold mt-2 block">${product.price}</span>
              </div>
              <div className={`ml-4 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-stone-800 group-hover:bg-accent/20' : 'bg-stone-50 group-hover:bg-accent/10'}`}>
                <Plus className="w-6 h-6 text-stone-400 group-hover:text-accent" />
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation for Category View */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t pb-safe transition-colors ${theme === 'dark' ? 'bg-stone-900/90 border-stone-800 backdrop-blur-md' : 'bg-white/90 border-stone-200 backdrop-blur-md'}`}>
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={() => {
                setSelectedTable(null);
                setActiveCategory('TODOS'); // Set activeCategory to 'TODOS' when table is deselected
                setSearchTerm(''); // Clear search term
              }}
              className={`p-3 rounded-2xl transition-colors shadow-sm flex items-center justify-center ${theme === 'dark' ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              <MapIcon className="w-6 h-6" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="text"
                placeholder="Buscar platillo por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border-none rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors shadow-sm ${theme === 'dark' ? 'bg-stone-800 text-white focus:ring-2 focus:ring-accent' : 'bg-white text-stone-900 focus:ring-2 focus:ring-accent'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-colors ${theme === 'dark' ? 'text-accent bg-accent/10 border-accent/20' : 'text-accent bg-accent/5 border-accent/10'}`}>
              Mesa {selectedTable}
            </span>
            <button 
              onClick={() => setIsOrderViewOpen(true)}
              className={`relative p-3 rounded-2xl transition-colors shadow-sm flex items-center gap-2 px-4 sm:px-6 ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}
            >
              <ClipboardList className="w-6 h-6 text-stone-400" />
              <span className={`hidden sm:inline font-bold ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>Comanda</span>
              {activeOrder?.items?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-stone-900">
                  {activeOrder.items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modifiers Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ModifierModal 
            product={selectedProduct} 
            initialNotes={editingOrderItem?.notes}
            onClose={() => {
               setSelectedProduct(null);
               setEditingOrderItem(null);
            }}
            onConfirm={(modifiers, notes) => {
              if (editingOrderItem) {
                updateOrderItemDetails(editingOrderItem.id, modifiers, notes);
                setEditingOrderItem(null);
              } else {
                addToOrder(selectedProduct, modifiers, notes);
              }
              setSelectedProduct(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Order View Slide-over */}
      <AnimatePresence>
        {isOrderViewOpen && (
          <OrderView 
            order={activeOrder?.items || []} 
            total={total}
            tableId={selectedTable}
            onClose={() => setIsOrderViewOpen(false)}
            onRemove={removeFromOrder}
            onUpdateQty={updateQuantity}
            onEditItem={(item: any) => {
              const baseProduct = products.find(p => p.id === item.product_id);
              if (baseProduct) {
                setEditingOrderItem(item);
                setSelectedProduct(baseProduct);
                setIsOrderViewOpen(false);
              }
            }}
            onSend={() => {
              setShowOrderSent(true);
              setTimeout(() => setShowOrderSent(false), 3000);
            }}
            onCloseAccount={() => setIsClosingAccount(true)}
            onClear={() => {
              setIsOrderViewOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {(showSuccess || showOrderSent) && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl z-50 pointer-events-none"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">
              {showOrderSent ? '¡Pedido enviado a cocina!' : 'Agregado al pedido'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <HistoryModal 
            history={history} 
            onClose={() => setIsHistoryOpen(false)} 
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Close Account Modal */}
      <AnimatePresence>
        {isClosingAccount && (
          <CloseAccountModal 
            total={total} 
            onClose={() => setIsClosingAccount(false)}
            onConfirm={closeAccount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModifierModal({ product, initialNotes, onClose, onConfirm, theme }: { 
  product: Product, 
  initialNotes?: string,
  onClose: () => void, 
  onConfirm: (mods: any[], notes: string) => void,
  theme: string
}) {
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedMugs, setSelectedMugs] = useState(0);
  const [selectedFrosting, setSelectedFrosting] = useState<string>('Ninguno');
  const [selectedListOptions, setSelectedListOptions] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    product.modifiers?.filter(m => m.type === 'list').forEach((m, idx) => {
      if (m.options?.find((o: any) => o.name === 'Con Hielo')) {
        initial[idx] = 'Con Hielo';
      }
    });
    return initial;
  });
  const [bucketSelections, setBucketSelections] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState(initialNotes || '');

  const baseSaucesLimit = product.modifiers?.find(m => m.type === 'sauces')?.baseSelections || 0;

  const handleSauceToggle = (sauceName: string) => {
    if (selectedSauces.includes(sauceName)) {
      setSelectedSauces(selectedSauces.filter(s => s !== sauceName));
    } else {
      setSelectedSauces([...selectedSauces, sauceName]);
    }
  };

  const handleConfirm = () => {
    const mods = [];
    if (selectedSauces.length > 0) {
      let sauceValue = selectedSauces.join(', ');
      let extraPrice = 0;
      
      if (selectedSauces.length > baseSaucesLimit) {
        // Calculate extra price for each sauce/dip beyond the allowed limit
        extraPrice = (selectedSauces.length - baseSaucesLimit) * 10;
        sauceValue += ` (+${selectedSauces.length - baseSaucesLimit} Extra)`;
      }

      mods.push({ 
        name: 'Salsas/Dips', 
        value: sauceValue, 
        extraPrice: extraPrice 
      });
    }
    if (product.modifiers?.some(m => m.type === 'mugs')) {
      if (selectedMugs > 0) {
        mods.push({ name: 'Tarros', value: `${selectedMugs} tarro(s)` });
      }
      if (selectedFrosting !== 'Ninguno') {
        mods.push({ name: 'Escarchado', value: selectedFrosting });
      }
    }
    const listMods = product.modifiers?.filter(m => m.type === 'list') || [];
    listMods.forEach((m, idx) => {
      if (selectedListOptions[idx]) {
        mods.push({ name: 'Selección', value: selectedListOptions[idx] });
      }
    });

    const bucketMod = product.modifiers?.find(m => m.type === 'bucket');
    if (bucketMod) {
      const selectionSummary = Object.entries(bucketSelections)
        .filter(([_, count]: [string, number]) => count > 0)
        .map(([id, count]: [string, number]) => {
          const opt = bucketMod.options?.find(o => o.id === id);
          return `${count} ${opt?.name}`;
        })
        .join(', ');
      if (selectionSummary) {
        mods.push({ name: 'Contenido Cubeta', value: selectionSummary });
      }
    }

    onConfirm(mods, notes);
  };

  const isFormValid = useMemo(() => {
    const bucketMod = product.modifiers?.find(m => m.type === 'bucket');
    const bucketTotal = Object.values(bucketSelections).reduce((a: number, b: number) => a + b, 0);
    if (bucketMod && bucketTotal !== bucketMod.maxSelections) return false;

    const listMods = product.modifiers?.filter(m => m.type === 'list') || [];
    for (let i = 0; i < listMods.length; i++) {
      if (!selectedListOptions[i]) return false;
    }

    return true;
  }, [product, bucketSelections, selectedListOptions]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className={`p-6 border-b flex justify-between items-center sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-800'}`}>{product.name}</h2>
            <p className="text-stone-500 text-sm">Personaliza tu pedido</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-stone-100 hover:bg-stone-200'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 space-y-8 transition-colors ${theme === 'dark' ? 'bg-stone-950' : 'bg-white'}`}>
          {product.modifiers?.some(m => m.type === 'sauces') && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Elige tus salsas / dips</h3>
                <span className="text-sm text-stone-400">
                  {selectedSauces.length} / {baseSaucesLimit} (+$10 c/u extra)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[...SAUCES, ...DIPS].map(sauce => (
                  <button
                    key={sauce.id}
                    onClick={() => handleSauceToggle(sauce.name)}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedSauces.includes(sauce.name)
                        ? 'bg-accent border-accent text-white shadow-md'
                        : theme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-400 hover:border-accent' : 'bg-white border-stone-200 text-stone-600 hover:border-accent'
                    }`}
                  >
                    {sauce.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mugs Section */}
          {product.modifiers?.some(m => m.type === 'mugs') && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Número de tarros</h3>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setSelectedMugs(Math.max(0, selectedMugs - 1))}
                    className={`p-3 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-stone-100 hover:bg-stone-200'}`}
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <span className="text-3xl font-bold w-8 text-center">{selectedMugs}</span>
                  <button 
                    onClick={() => setSelectedMugs(Math.min(5, selectedMugs + 1))}
                    className={`p-3 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-stone-100 hover:bg-stone-200'}`}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Escarchado</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Ninguno', ...FROSTING.map(f => f.name)].map(f => (
                    <button
                      key={f}
                      onClick={() => setSelectedFrosting(f)}
                      className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                        selectedFrosting === f
                          ? 'bg-accent border-accent text-white shadow-md'
                          : theme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-400 hover:border-accent' : 'bg-white border-stone-200 text-stone-600 hover:border-accent'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List Section */}
          {product.modifiers?.filter(m => m.type === 'list').map((m, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Selecciona una opción</h3>
              <div className="grid grid-cols-2 gap-2">
                {m.options?.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedListOptions(prev => ({ ...prev, [idx]: opt.name }))}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedListOptions[idx] === opt.name
                        ? 'bg-accent border-accent text-white shadow-md'
                        : theme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-400 hover:border-accent' : 'bg-white border-stone-200 text-stone-600 hover:border-accent'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bucket Section */}
          {product.modifiers?.filter(m => m.type === 'bucket').map((m, idx) => {
            const maxSelections = typeof m.maxSelections === 'number' ? m.maxSelections : 0;
            const currentTotal = Object.values(bucketSelections).reduce((a: number, b: number) => a + b, 0) as number;
            const remaining = maxSelections - currentTotal;

            return (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Elige tus cervezas</h3>
                  <span className={`text-sm font-bold ${remaining === 0 ? 'text-emerald-500' : 'text-accent'}`}>
                    {currentTotal} / {m.maxSelections}
                  </span>
                </div>
                <div className="space-y-3">
                  {m.options?.map(opt => (
                    <div key={opt.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                      <span className={`font-medium ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>{opt.name}</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setBucketSelections({
                            ...bucketSelections,
                            [opt.id]: Math.max(0, (bucketSelections[opt.id] || 0) - 1)
                          })}
                          className={`p-1 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-200 shadow-sm'}`}
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-bold w-4 text-center">
                          {bucketSelections[opt.id] || 0}
                        </span>
                        <button 
                          onClick={() => {
                            const maxSelections = typeof m.maxSelections === 'number' ? m.maxSelections : 0;
                            const currentTotal = Object.values(bucketSelections).reduce((a: number, b: number) => a + b, 0) as number;
                            if (currentTotal < maxSelections) {
                              setBucketSelections({
                                ...bucketSelections,
                                [opt.id]: (bucketSelections[opt.id] || 0) + 1
                              });
                            }
                          }}
                          className={`p-1 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-200 shadow-sm'}`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>Notas adicionales</h3>
            <textarea
              placeholder="Ej: Sin cebolla, muy frío, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full rounded-2xl p-4 min-h-[100px] outline-none transition-colors ${theme === 'dark' ? 'bg-stone-900 border border-stone-800 text-white focus:ring-2 focus:ring-accent' : 'bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-accent'}`}
            />
          </div>
        </div>

        <div className={`p-6 border-t sticky bottom-0 transition-colors ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              isFormValid 
                ? 'bg-accent text-white shadow-accent/20 hover:opacity-90' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none dark:bg-stone-800 dark:text-stone-600'
            }`}
          >
            {isFormValid ? 'Confirmar y Agregar' : `Completa las selecciones`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderView({ order, total, tableId, onClose, onRemove, onUpdateQty, onEditItem, onClear, onSend, onCloseAccount, theme }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className={`w-full max-w-md h-full flex flex-col shadow-2xl transition-colors ${theme === 'dark' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}
      >
        <div className={`p-6 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'border-stone-800' : 'border-stone-100'}`}>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'}`}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold">Comanda</h2>
              <span className="text-xs font-bold text-accent uppercase tracking-widest">Mesa {tableId}</span>
            </div>
          </div>
          <button 
            onClick={onCloseAccount}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-stone-100 text-stone-900 hover:bg-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
          >
            <CreditCard className="w-4 h-4" />
            Cerrar Cuenta
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {order.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-lg">La comanda está vacía</p>
            </div>
          ) : (
            order.map(item => (
              <div key={item.id} className="flex gap-4 group">
                <div className="flex-1 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 p-2 -m-2 rounded-xl transition-colors" onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  onEditItem(item);
                }}>
                  <div className="flex justify-between">
                    <h4 className="font-bold flex items-center gap-2">
                       {item.name}
                       <Settings className="w-4 h-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <span className="font-bold text-accent">${item.price * item.quantity}</span>
                  </div>
                  {item.modifiers?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {item.modifiers.map((m: any, idx: number) => (
                        <p key={idx} className="text-xs text-stone-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="font-medium">{m.name}:</span> {Array.isArray(m.value) ? m.value.join(', ') : m.value}
                          {m.extraPrice ? ` (+ $${m.extraPrice})` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs italic text-stone-400 mt-1">"{item.notes}"</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`flex items-center rounded-xl px-2 py-1 transition-colors ${theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'}`}>
                      <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 hover:text-accent">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 hover:text-accent">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`p-6 border-t space-y-4 transition-colors ${theme === 'dark' ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
          <div className="flex justify-between items-center">
            <span className="text-stone-500 font-medium">Total Estimado</span>
            <span className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>${total}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onClose}
              className="bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition-all"
            >
              Regresar al Menú
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CloseAccountModal({ total, onClose, onConfirm, theme }: any) {
  const [tipPercent, setTipPercent] = useState(10);
  const [manualTip, setManualTip] = useState<string>('');
  const [isManual, setIsManual] = useState(false);

  const tipAmount = isManual ? parseFloat(manualTip) || 0 : (total * tipPercent) / 100;
  const finalTotal = total + tipAmount;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-colors ${theme === 'dark' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}
      >
        <div className={`p-6 border-b flex justify-between items-center transition-colors ${theme === 'dark' ? 'border-stone-800' : 'border-stone-100'}`}>
          <h2 className="text-2xl font-bold">Cerrar Cuenta</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-2xl space-y-2 transition-colors ${theme === 'dark' ? 'bg-stone-950' : 'bg-stone-50'}`}>
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-accent font-bold">
              <span>Propina</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div className={`h-px my-2 transition-colors ${theme === 'dark' ? 'bg-stone-800' : 'bg-stone-200'}`} />
            <div className={`flex justify-between text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold uppercase text-xs tracking-widest text-stone-400">Seleccionar Propina</h3>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setTipPercent(p);
                    setIsManual(false);
                  }}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    !isManual && tipPercent === p 
                      ? 'bg-accent text-white shadow-md' 
                      : theme === 'dark' ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsManual(true)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  isManual 
                    ? theme === 'dark' ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-white shadow-md' 
                    : theme === 'dark' ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Manual
              </button>
              {isManual && (
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input 
                    type="number"
                    value={manualTip}
                    onChange={(e) => setManualTip(e.target.value)}
                    className={`w-full rounded-xl py-3 pl-7 pr-3 outline-none transition-colors ${theme === 'dark' ? 'bg-stone-800 border border-stone-700 text-white focus:ring-2 focus:ring-accent' : 'bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-accent'}`}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-6 transition-colors ${theme === 'dark' ? 'bg-stone-950' : 'bg-stone-50'}`}>
          <button
            onClick={() => onConfirm(total, tipAmount, isManual ? 0 : tipPercent)}
            className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-all"
          >
            Finalizar y Liberar Mesa
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TableButton({ table, isAdminMode, isDousonMode, theme, onDelete, onSelect, onMigrate, onRename }: any) {
  const longPressProps = useLongPress(
    () => isDousonMode ? onRename() : onMigrate(),
    () => onSelect()
  );

  return (
    <motion.div
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="w-full"
    >
      <button
        {...longPressProps}
        className={`group relative w-full aspect-square rounded-[1.5rem] flex flex-col items-center justify-center border-4 transition-all shadow-lg ${
          isAdminMode 
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white' 
            : table.isOccupied
              ? 'bg-accent border-accent/30 text-white hover:scale-105 active:scale-95'
              : theme === 'dark'
                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:border-accent hover:scale-105 active:scale-95'
                : 'bg-white border-stone-100 text-stone-700 hover:border-accent hover:scale-105 active:scale-95'
        }`}
      >
        {table.alias ? (
          <>
            <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider leading-none text-center px-1 line-clamp-2" style={{ wordBreak: 'break-word' }}>
              {table.alias}
            </span>
            <span className={`text-[9px] mt-0.5 font-medium ${table.isOccupied ? 'text-white/50' : 'text-stone-400'}`}>Mesa {table.id}</span>
          </>
        ) : (
          <>
            <span className={`text-[8px] font-black uppercase tracking-widest ${table.isOccupied ? 'text-white/60' : 'text-stone-400'}`}>Mesa</span>
            <span className="text-xl sm:text-2xl font-black leading-none">{table.id}</span>
          </>
        )}
        {table.isOccupied && !isAdminMode && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
        {isAdminMode && <Trash2 className="w-4 h-4 mt-1" />}
      </button>
    </motion.div>
  );
}

function HistoryModal({ history, onClose, theme }: { history: any[], onClose: () => void, theme: string }) {
  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    history.forEach(order => {
      const date = new Date(order.closed_at).toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return Object.entries(groups);
  }, [history]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] transition-colors ${theme === 'dark' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}
      >
        <div className={`p-6 border-b flex justify-between items-center transition-colors ${theme === 'dark' ? 'border-stone-800' : 'border-stone-100'}`}>
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Historial de Ventas</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {history.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p>No hay pedidos cerrados en los últimos 7 días</p>
            </div>
          ) : (
            groupedHistory.map(([date, orders]) => (
              <div key={date} className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-widest text-stone-400 border-b pb-2 transition-colors ${theme === 'dark' ? 'border-stone-800' : 'border-stone-100'}`}>{date}</h3>
                <div className="grid gap-4">
                  {orders.map(order => (
                    <div key={order.id} className={`p-4 rounded-2xl border space-y-3 transition-colors ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest">Mesa {order.table_id}</span>
                          <p className="text-xs text-stone-400">{new Date(order.closed_at).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>${(order.total + order.tip).toFixed(2)}</p>
                          <p className="text-[10px] text-stone-400">Propina: ${order.tip.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item: any, idx: number) => (
                          <span key={idx} className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-stone-700 border-stone-600 text-stone-300' : 'bg-white border-stone-200 text-stone-600'}`}>
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

