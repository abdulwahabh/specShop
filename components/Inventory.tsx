
import React, { useState } from 'react';
import { InventoryItem, Category, Supplier } from '../types';
import { Plus, Search, Tag, Trash2, ArrowUpCircle, Package, X, IndianRupee } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  categories: Category[];
  suppliers: Supplier[];
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onRestock: (itemId: string, quantity: number) => void;
  onUpdateCategories: (categories: Category[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, categories, suppliers, onAddItem, onRestock, onUpdateCategories }) => {
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');

  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    name: '', category: categories[0] || '', sku: '', quantity: 0, costPrice: 0, sellingPrice: 0, supplierId: '', description: ''
  });

  const [restockSearch, setRestockSearch] = useState('');
  const [restockData, setRestockData] = useState({ itemId: '', quantity: 0, sku: '', currentStock: 0, name: '' });

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const restockSearchResults = restockSearch 
    ? inventory.filter(i => i.name.toLowerCase().includes(restockSearch.toLowerCase()) || i.sku.toLowerCase().includes(restockSearch.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectItemForRestock = (item: InventoryItem) => {
    setRestockData({ itemId: item.id, name: item.name, sku: item.sku, currentStock: item.quantity, quantity: 0 });
    setRestockSearch('');
  };

  const handleAddCategory = () => {
    if (newCat && !categories.includes(newCat)) {
      onUpdateCategories([...categories, newCat]);
      setNewCat('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    onUpdateCategories(categories.filter(c => c !== cat));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Search by name or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <Tag size={18} /> Categories
          </button>
          <button onClick={() => setShowRestockModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition-colors">
            <ArrowUpCircle size={18} /> Add Stock
          </button>
          <button onClick={() => setShowItemModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-colors">
            <Plus size={18} /> New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">SKU</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Prices (₹)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Package size={20} /></div>
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.sku}</td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${item.quantity < 10 ? 'text-red-500' : 'text-slate-800'}`}>{item.quantity} units</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-400">Cost: <IndianRupee size={12}/>{item.costPrice}</div>
                  <div className="flex items-center gap-1 text-indigo-600 font-bold">Sell: <IndianRupee size={12}/>{item.sellingPrice}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {suppliers.find(s => s.id === item.supplierId)?.name || 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Manage Categories</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="New Category Name..."
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                />
                <button onClick={handleAddCategory} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors">Add</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                    <span className="font-medium text-slate-700">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Restock Product</h3>
              <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Find Product (Name or SKU)</label>
                <input 
                  className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type to search..."
                  value={restockSearch}
                  onChange={(e) => setRestockSearch(e.target.value)}
                />
                {restockSearch && (
                  <div className="absolute top-full left-0 right-0 bg-white shadow-xl border rounded-xl mt-1 z-10 overflow-hidden">
                    {restockSearchResults.map(item => (
                      <button 
                        key={item.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0"
                        onClick={() => handleSelectItemForRestock(item)}
                      >
                        <div className="font-bold text-sm">{item.name} ({item.sku})</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {restockData.itemId && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in zoom-in-95">
                  <div className="font-bold text-slate-800">{restockData.name}</div>
                  <div className="text-xs text-slate-500 mb-2">Current Stock: {restockData.currentStock} units</div>
                  <label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">Units to Add</label>
                  <input 
                    type="number" min="1" className="w-full p-3 bg-white rounded-xl border border-emerald-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    value={restockData.quantity || ''}
                    onChange={e => setRestockData({...restockData, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button onClick={() => setShowRestockModal(false)} className="px-6 py-2 border rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                <button 
                  disabled={!restockData.itemId || !restockData.quantity}
                  onClick={() => { onRestock(restockData.itemId, restockData.quantity); setShowRestockModal(false); }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  Save Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">New Product</h3>
              <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAddItem(newItem); setShowItemModal(false); }} className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Name</label>
                <input required placeholder="Item Name" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">SKU</label>
                <input required placeholder="SKU ID" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, sku: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Initial Quantity</label>
                <input required type="number" placeholder="Quantity" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cost Price (₹)</label>
                <input required type="number" placeholder="Cost" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, costPrice: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Selling Price (₹)</label>
                <input required type="number" placeholder="Sell" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, sellingPrice: parseFloat(e.target.value)})} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Supplier</label>
                <select required className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewItem({...newItem, supplierId: e.target.value})}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 pt-4 flex gap-3">
                 <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3 border-2 border-slate-100 text-slate-400 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
