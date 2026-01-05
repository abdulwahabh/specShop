
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  AlertCircle,
  Truck,
  LogOut
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Reports from './components/Reports';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import { InventoryItem, Sale, Category, SaleStatus, Supplier } from './types';
import { api } from './api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'reports' | 'suppliers'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{name: string} | null>(null);
  
  const [categories, setCategories] = useState<Category[]>(['Specs', 'Lens']);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Initial Data & Auth Fetch
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const session = api.checkSession();
        if (session) {
          setIsAuthenticated(true);
          setUser(session);
          
          const [supData, invData, salesData] = await Promise.all([
            api.getSuppliers(),
            api.getInventory(),
            api.getSales()
          ]);
          setSuppliers(supData);
          setInventory(invData);
          setSales(salesData);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleLogin = async (username: string, pass: string) => {
    const userData = await api.login(username, pass);
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      // Fetch full data after login
      const [supData, invData, salesData] = await Promise.all([
        api.getSuppliers(),
        api.getInventory(),
        api.getSales()
      ]);
      setSuppliers(supData);
      setInventory(invData);
      setSales(salesData);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const addInventory = async (item: Omit<InventoryItem, 'id'>) => {
    const newItem = await api.addInventoryItem(item);
    setInventory(prev => [...prev, newItem]);
  };

  const restockInventory = async (itemId: string, quantity: number) => {
    await api.updateStock(itemId, quantity);
    setInventory(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
    ));
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'balance'>) => {
    const newSale = await api.processSale(saleData);
    setSales(prev => [newSale, ...prev]);
    const updatedInv = await api.getInventory();
    setInventory(updatedInv);
  };

  const updateSaleStatus = async (saleId: string, newStatus: SaleStatus, finalPaymentReceived?: number) => {
    await api.updateSaleStatus(saleId, newStatus, finalPaymentReceived);
    const [updatedSales, updatedInv] = await Promise.all([
      api.getSales(),
      api.getInventory()
    ]);
    setSales(updatedSales);
    setInventory(updatedInv);
  };

  const addSupplier = async (sup: Omit<Supplier, 'id'>) => {
    const newSup = await api.addSupplier(sup);
    setSuppliers(prev => [...prev, newSup]);
  };

  const updateSupplier = async (id: string, data: Omit<Supplier, 'id'>) => {
    const updatedSup = await api.updateSupplier(id, data);
    setSuppliers(prev => prev.map(s => s.id === id ? updatedSup : s));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-indigo-900 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl mb-4"></div>
          <span className="font-bold tracking-widest uppercase">OptiMaster Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-indigo-900 text-white fixed h-full shadow-xl z-20 transition-all print:hidden flex flex-col">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <LayoutDashboard className="text-indigo-900 w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">OptiMaster</span>
        </div>
        
        <nav className="mt-8 px-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-100'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-100'}`}>
            <Package size={20} /> <span className="font-medium">Inventory</span>
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'sales' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-100'}`}>
            <ShoppingCart size={20} /> <span className="font-medium">Sales</span>
          </button>
          <button onClick={() => setActiveTab('suppliers')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'suppliers' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-100'}`}>
            <Truck size={20} /> <span className="font-medium">Suppliers</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800 text-indigo-100'}`}>
            <FileText size={20} /> <span className="font-medium">Reports</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-indigo-800/50">
          <div className="bg-indigo-800/50 p-4 rounded-2xl border border-indigo-700/50 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs uppercase">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-indigo-300 font-medium">Administrator</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-red-300 hover:bg-red-500/10 hover:text-red-400 font-bold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        <header className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab} Overview</h1>
            <p className="text-slate-500">Full-Stack Optical Management</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium">
             <Settings size={18} /> Settings
          </button>
        </header>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <Dashboard inventory={inventory} sales={sales} />}
          {activeTab === 'inventory' && <Inventory inventory={inventory} categories={categories} suppliers={suppliers} onAddItem={addInventory} onRestock={restockInventory} onUpdateCategories={setCategories} />}
          {activeTab === 'sales' && <Sales sales={sales} inventory={inventory} onAddSale={addSale} onUpdateStatus={updateSaleStatus} />}
          {activeTab === 'suppliers' && <Suppliers suppliers={suppliers} inventory={inventory} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} />}
          {activeTab === 'reports' && <Reports sales={sales} inventory={inventory} />}
        </div>
      </main>
    </div>
  );
};

export default App;
