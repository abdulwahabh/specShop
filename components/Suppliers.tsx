
import React, { useState, useMemo } from 'react';
import { Supplier, InventoryItem } from '../types';
import { 
  Plus, 
  Search, 
  Truck, 
  Phone, 
  MapPin, 
  X, 
  Edit2, 
  ListFilter, 
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SuppliersProps {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  onAddSupplier: (sup: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (id: string, sup: Omit<Supplier, 'id'>) => void;
}

const ITEMS_PER_PAGE = 6;

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, inventory, onAddSupplier, onUpdateSupplier }) => {
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '' });

  // Sorting: Latest first (Descending ID)
  const processedSuppliers = useMemo(() => {
    return suppliers
      .filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.mobile.includes(searchTerm)
      )
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [suppliers, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(processedSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedSuppliers.slice(start, start + ITEMS_PER_PAGE);
  }, [processedSuppliers, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name, mobile: supplier.mobile, address: supplier.address });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', mobile: '', address: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      onUpdateSupplier(editingSupplier.id, formData);
    } else {
      onAddSupplier(formData);
    }
    setShowModal(false);
    setCurrentPage(1);
  };

  const getSupplierItems = (supplierId: string) => {
    return inventory.filter(item => item.supplierId === supplierId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            placeholder="Search suppliers..."
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
          <Plus size={20} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSuppliers.map((sup) => {
          const itemCount = getSupplierItems(sup.id).length;
          return (
            <div key={sup.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow group relative">
              <div className="absolute top-6 right-6 flex gap-2">
                <button 
                  onClick={() => handleOpenModal(sup)}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Edit Supplier"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{sup.name}</h3>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sup.id}</div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-50 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" /> {sup.mobile}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400" /> {sup.address}
                </div>
              </div>
              <button 
                onClick={() => setShowItemsModal(sup)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                <ListFilter size={14} /> View {itemCount} Items
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer for Grid */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 pt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Supplier Items List Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{showItemsModal.name} - Inventory</h3>
              </div>
              <button onClick={() => setShowItemsModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Item Name</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">SKU</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-center">Stock</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Cost Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getSupplierItems(showItemsModal.id).length > 0 ? (
                    getSupplierItems(showItemsModal.id).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-700">{item.name}</td>
                        <td className="py-4 text-sm text-slate-500">{item.sku}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.quantity < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="py-4 text-right font-black text-slate-800">₹{item.costPrice}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400">
                        <Package size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No items linked</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-slate-800">
                {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Supplier Name</label>
                <input required placeholder="Name" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mobile Number</label>
                <input required placeholder="Phone" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Address</label>
                <textarea required placeholder="Address" rows={3} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-slate-50 text-slate-400 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest">
                  {editingSupplier ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
