
import React, { useState, useMemo } from 'react';
import { Sale, InventoryItem, SaleStatus, SaleItem } from '../types';
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  ShoppingCart, 
  User, 
  X, 
  Package, 
  SearchCheck, 
  FileX,
  Phone,
  HandCoins,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  inventory: InventoryItem[];
  onAddSale: (sale: Omit<Sale, 'id' | 'date' | 'balance'>) => void;
  onUpdateStatus: (id: string, status: SaleStatus, payment?: number) => void;
}

const ITEMS_PER_PAGE = 8;

const Sales: React.FC<SalesProps> = ({ sales, inventory, onAddSale, onUpdateStatus }) => {
  const [showModal, setShowModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState<Sale | null>(null);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Weekly' | 'Monthly'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Cart & Customer State
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', mobile: '', place: '' });
  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  const subTotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.subTotal, 0), [cartItems]);
  const totalPrice = Math.max(0, subTotal - discount);

  const uniqueCustomers = useMemo(() => {
    const map = new Map();
    sales.forEach(s => {
      if (!map.has(s.customerMobile)) {
        map.set(s.customerMobile, {
          name: s.customerName,
          email: s.customerEmail || '',
          mobile: s.customerMobile,
          place: s.customerPlace
        });
      }
    });
    return Array.from(map.values());
  }, [sales]);

  // Combined filtering and sorting (Latest First)
  const processedSales = useMemo(() => {
    const now = new Date();
    const filtered = sales.filter(s => {
      const saleDate = new Date(s.date);
      const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.customerMobile.includes(searchTerm) ||
                           s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'Weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === 'Monthly') {
        matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesDate;
    });

    // Ensure strictly Latest First
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(processedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedSales.slice(start, start + ITEMS_PER_PAGE);
  }, [processedSales, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const productSearchResults = productSearch 
    ? inventory.filter(i => (i.name.toLowerCase().includes(productSearch.toLowerCase()) || i.sku.toLowerCase().includes(productSearch.toLowerCase())) && i.quantity > 0).slice(0, 5)
    : [];

  const customerSearchResults = customerSearch
    ? uniqueCustomers.filter(c => (c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile.includes(customerSearch))).slice(0, 5)
    : [];

  const addToCart = (item: InventoryItem) => {
    const existing = cartItems.find(x => x.itemId === item.id);
    if (existing) {
      setCartItems(cartItems.map(x => x.itemId === item.id ? { ...x, quantity: x.quantity + 1, subTotal: (x.quantity + 1) * x.unitPrice } : x));
    } else {
      // Correctly initializing a new SaleItem with all required properties, including unitCostPrice.
      setCartItems([...cartItems, { 
        itemId: item.id, 
        name: item.name, 
        sku: item.sku, 
        quantity: 1, 
        unitPrice: item.sellingPrice, 
        unitCostPrice: item.costPrice, 
        subTotal: item.sellingPrice 
      }]);
    }
    setProductSearch('');
  };

  const selectCustomer = (customer: typeof customerInfo) => {
    setCustomerInfo(customer);
    setCustomerSearch('');
  };

  const removeFromCart = (itemId: string) => setCartItems(cartItems.filter(x => x.itemId !== itemId));

  const updateCartQty = (itemId: string, qty: number) => {
    setCartItems(cartItems.map(x => x.itemId === itemId ? { ...x, quantity: qty, subTotal: qty * x.unitPrice } : x));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    onAddSale({
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerMobile: customerInfo.mobile,
      customerPlace: customerInfo.place,
      items: cartItems,
      subTotal,
      discount,
      totalPrice,
      advancePaid,
      status: SaleStatus.PENDING
    });
    
    setShowModal(false);
    resetForm();
    setCurrentPage(1); // Jump to first page to see new entry
  };

  const resetForm = () => {
    setCartItems([]);
    setCustomerInfo({ name: '', email: '', mobile: '', place: '' });
    setCustomerSearch('');
    setDiscount(0);
    setAdvancePaid(0);
  };

  const handlePrint = (sale: Sale) => {
    setSelectedSaleForPrint(sale);
    setTimeout(() => {
      window.print();
      setSelectedSaleForPrint(null);
    }, 100);
  };

  const getStatusStyle = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case SaleStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Invoice Logic */}
      {selectedSaleForPrint && (
        <div className="hidden print:block p-10 bg-white text-slate-800 font-sans">
          <div className="flex justify-between border-b pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-indigo-700 tracking-tighter">OPTIMASTER</h1>
              <p className="text-sm text-slate-500">Specs & Lens Specialists</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">INVOICE</h2>
              <p className="text-sm">ID: {selectedSaleForPrint.id}</p>
              <p className="text-sm">Date: {new Date(selectedSaleForPrint.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mb-8 grid grid-cols-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer Details</h3>
              <p className="font-bold text-lg">{selectedSaleForPrint.customerName}</p>
              <p className="text-sm">{selectedSaleForPrint.customerMobile}</p>
              <p className="text-sm">{selectedSaleForPrint.customerPlace}</p>
            </div>
            <div className="text-right">
               <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusStyle(selectedSaleForPrint.status)}`}>
                 Status: {selectedSaleForPrint.status}
               </div>
            </div>
          </div>
          <table className="w-full text-left mb-8 border-collapse">
            <thead className="border-b-2">
              <tr>
                <th className="py-2">Product Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedSaleForPrint.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 font-medium">{item.name} <span className="text-[10px] text-slate-400 ml-2">({item.sku})</span></td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.unitPrice}</td>
                  <td className="py-2 text-right font-bold">₹{item.subTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{selectedSaleForPrint.subTotal}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-₹{selectedSaleForPrint.discount}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total Amount:</span><span>₹{selectedSaleForPrint.totalPrice}</span></div>
              <div className="flex justify-between text-slate-600"><span>Total Paid:</span><span>₹{selectedSaleForPrint.advancePaid}</span></div>
              <div className="flex justify-between text-red-600 font-bold border-t-2 border-slate-100 pt-1"><span>Balance Due:</span><span>₹{selectedSaleForPrint.balance}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Sales Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center print:hidden">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              placeholder="Search Orders..."
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
            {(['All', 'Today', 'Weekly', 'Monthly'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => { setDateFilter(p); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
          <Plus size={20} /> New Sale Entry
        </button>
      </div>

      {/* Sales Table with Particulars */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Invoice / Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Customer Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Particulars (Items)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Pricing & Payments</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Order Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length > 0 ? paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-indigo-600 text-sm mb-0.5">{sale.id}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase">
                      <Calendar size={12} />
                      {new Date(sale.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{sale.customerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                      <Phone size={12} className="text-indigo-400"/> {sale.customerMobile}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{sale.customerPlace}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {sale.items.map((item, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded border border-slate-200">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-700">₹{sale.totalPrice}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-[9px] text-emerald-600 font-black uppercase">Recv: ₹{sale.advancePaid}</span>
                      {sale.balance > 0 && <span className="text-[9px] text-red-500 font-black uppercase">Due: ₹{sale.balance}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handlePrint(sale)} title="Print Invoice" className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"><Printer size={18} /></button>
                      {sale.status === SaleStatus.PENDING && (
                        <button onClick={() => setShowCollectModal(sale)} title="Complete & Collect Balance" className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"><HandCoins size={18} /></button>
                      )}
                      {sale.status !== SaleStatus.CANCELLED && (
                        <button onClick={() => { if(confirm('Cancel order and return items to stock?')) onUpdateStatus(sale.id, SaleStatus.CANCELLED)}} title="Cancel Order" className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><FileX size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-300">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-black uppercase tracking-widest text-xs">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {paginatedSales.length} of {processedSales.length} Orders
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1 px-3">
                 <span className="text-sm font-black text-indigo-600">{currentPage}</span>
                 <span className="text-sm font-bold text-slate-300">/</span>
                 <span className="text-sm font-bold text-slate-400">{totalPages}</span>
              </div>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Balance Collection Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl"><HandCoins size={28}/></div>
                   <div>
                     <h3 className="text-xl font-bold">Collect Balance</h3>
                     <p className="text-emerald-100 text-sm">{showCollectModal.id} • {showCollectModal.customerName}</p>
                   </div>
                </div>
                <button onClick={() => setShowCollectModal(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-center">
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Outstanding Balance</p>
                   <h2 className="text-4xl font-black text-slate-800">₹{showCollectModal.balance}</h2>
                </div>
                <button 
                  onClick={() => {
                    onUpdateStatus(showCollectModal.id, SaleStatus.COMPLETED, showCollectModal.balance);
                    setShowCollectModal(null);
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest"
                >
                  Receive ₹{showCollectModal.balance} & Complete
                </button>
                <button onClick={() => setShowCollectModal(null)} className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600">
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={24} /> New Sale Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><User size={14} /> Customer Info</h4>
                  <div className="relative">
                    <input 
                      className="w-full pl-10 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search existing customer..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <SearchCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                    {customerSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white shadow-xl border rounded-xl mt-2 z-50 max-h-48 overflow-auto">
                        {customerSearchResults.map((c, i) => (
                          <button key={i} type="button" className="w-full text-left p-3 hover:bg-indigo-50 border-b flex justify-between items-center" onClick={() => selectCustomer(c)}>
                            <div className="text-sm font-bold">{c.name} ({c.mobile})</div>
                            <ArrowRight size={14} className="text-slate-300"/>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <input required placeholder="Customer Full Name" className="w-full p-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    <input required placeholder="Mobile Contact" className="w-full p-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={customerInfo.mobile} onChange={e => setCustomerInfo({...customerInfo, mobile: e.target.value})} />
                    <input required placeholder="Place / Location" className="w-full p-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={customerInfo.place} onChange={e => setCustomerInfo({...customerInfo, place: e.target.value})} />
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><Package size={14} /> Item Selection</h4>
                  <div className="relative">
                    <input className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    {productSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border rounded-2xl mt-2 z-50 overflow-hidden">
                        {productSearchResults.map(item => (
                          <button key={item.id} type="button" className="w-full text-left p-4 hover:bg-indigo-50 border-b flex justify-between items-center group" onClick={() => addToCart(item)}>
                            <div><div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.name}</div><div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{item.category} • SKU: {item.sku} • Stock: {item.quantity}</div></div>
                            <div className="font-black text-indigo-600 flex items-center bg-indigo-50 px-3 py-1 rounded-lg">₹{item.sellingPrice}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-[200px] border rounded-[2rem] bg-slate-50/50 p-6 space-y-3 overflow-y-auto max-h-[400px] shadow-inner">
                    {cartItems.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-10">
                          <ShoppingCart size={48} strokeWidth={1} className="opacity-20"/>
                          <p className="font-bold uppercase tracking-widest text-[10px]">Add items to cart</p>
                       </div>
                    ) : cartItems.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between animate-in slide-in-from-right-2">
                        <div className="flex-1"><div className="font-bold text-slate-700">{item.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU: {item.sku}</div></div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden p-1">
                              <button type="button" onClick={() => updateCartQty(item.itemId, Math.max(1, item.quantity - 1))} className="px-3 py-1 hover:bg-white rounded-lg transition-colors font-bold text-indigo-600">-</button>
                              <span className="w-10 text-center font-black text-slate-700">{item.quantity}</span>
                              <button type="button" onClick={() => updateCartQty(item.itemId, item.quantity + 1)} className="px-3 py-1 hover:bg-white rounded-lg transition-colors font-bold text-indigo-600">+</button>
                           </div>
                           <div className="font-black w-24 text-right text-indigo-900">₹{item.subTotal.toLocaleString()}</div>
                           <button type="button" onClick={() => removeFromCart(item.itemId)} className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-indigo-300 font-bold uppercase text-[10px] tracking-widest">
                        <span>Items Subtotal</span>
                        <span className="text-white text-base">₹{subTotal.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Applied Discount (₹)</label>
                        <input type="number" placeholder="0.00" className="w-full bg-indigo-900/50 border border-indigo-800 rounded-xl p-3 text-emerald-400 font-black outline-none focus:ring-1 focus:ring-emerald-500" onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Grand Total</span>
                        <h2 className="text-4xl font-black text-white">₹{totalPrice.toLocaleString()}</h2>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Advance Payment Received (₹)</label>
                        <input type="number" placeholder="Enter amount..." className="w-full bg-indigo-900/50 border border-indigo-800 rounded-xl p-3 text-white font-black outline-none focus:ring-1 focus:ring-indigo-400" onChange={e => setAdvancePaid(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="text-right">
                         <span className={`text-xs font-black uppercase tracking-widest ${totalPrice - advancePaid > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                           {totalPrice - advancePaid > 0 ? `Balance: ₹${(totalPrice - advancePaid).toLocaleString()}` : 'Fully Paid'}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={cartItems.length === 0} className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700 transition-all uppercase tracking-[0.2em]">Process and Save Order</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
