
import React, { useMemo, useState } from 'react';
import { InventoryItem, Sale, SaleStatus } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Printer, FileText, ChevronRight, TrendingUp, IndianRupee, Package, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  inventory: InventoryItem[];
}

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

const Reports: React.FC<ReportsProps> = ({ sales, inventory }) => {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const filteredSales = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
      if (sale.status === SaleStatus.CANCELLED) return false;
      const saleDate = new Date(sale.date);

      switch (period) {
        case 'Daily':
          return saleDate.toDateString() === now.toDateString();
        case 'Weekly':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          weekAgo.setHours(0,0,0,0);
          return saleDate >= weekAgo;
        case 'Monthly':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'Custom':
          if (!dateRange.start || !dateRange.end) return true;
          const start = new Date(dateRange.start);
          start.setHours(0,0,0,0);
          const end = new Date(dateRange.end);
          end.setHours(23,59,59,999);
          return saleDate >= start && saleDate <= end;
        default:
          return true;
      }
    });
  }, [sales, period, dateRange]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalPaid = filteredSales.reduce((acc, s) => acc + s.advancePaid, 0);
    const totalBalance = filteredSales.reduce((acc, s) => acc + s.balance, 0);
    
    // Calculate Profit: Revenue - Cost of items sold
    const totalCost = filteredSales.reduce((acc, s) => {
      const saleCost = s.items.reduce((itemAcc, item) => itemAcc + (item.unitCostPrice * item.quantity), 0);
      return acc + saleCost;
    }, 0);

    const profit = totalSales - totalCost;
    const stockValue = inventory.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);

    return { totalSales, totalPaid, totalBalance, profit, stockValue, count: filteredSales.length };
  }, [filteredSales, inventory]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + item.quantity;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const salesTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      const d = new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      dailyMap[d] = (dailyMap[d] || 0) + s.totalPrice;
    });
    return Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 print:p-0">
      {/* Header Toolbar */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 justify-between items-center print:hidden">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
          {(['Daily', 'Weekly', 'Monthly', 'Custom'] as Period[]).map((p) => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)}
              className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {period === 'Custom' && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <input type="date" className="p-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            <ChevronRight className="text-slate-300" size={16}/>
            <input type="date" className="p-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        )}

        <button 
          onClick={handlePrintReport}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <IndianRupee size={80} />
           </div>
           <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Gross Revenue</p>
           <h3 className="text-3xl font-black">₹{stats.totalSales.toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2 text-indigo-200 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
              <TrendingUp size={14} /> Tracking {stats.count} Orders
           </div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <TrendingUp size={80} />
           </div>
           <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Net Profit ({period})</p>
           <h3 className="text-3xl font-black">₹{stats.profit.toLocaleString()}</h3>
           <div className={`mt-4 flex items-center gap-2 text-xs font-bold w-fit px-3 py-1 rounded-full ${stats.profit > 0 ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-100'}`}>
              {stats.profit > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {((stats.profit / (stats.totalSales || 1)) * 100).toFixed(1)}% Margin
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Inventory Valuation</p>
           <h3 className="text-3xl font-black text-slate-800">₹{stats.stockValue.toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-50 w-fit px-3 py-1 rounded-full">
              <Package size={14} className="text-indigo-500" /> Asset Value at Cost
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Receivables</p>
           <h3 className="text-3xl font-black text-red-500">₹{stats.totalBalance.toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-bold bg-red-50 w-fit px-3 py-1 rounded-full">
              <ShoppingBag size={14} /> Awaiting Payments
           </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 print:mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Performance Trend</h3>
              <p className="text-xs font-bold text-slate-400 uppercase">Sales analytics for {period} period</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip cursor={{stroke: '#6366f1', strokeWidth: 2}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 print:hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Inventory Split</h3>
              <p className="text-xs font-bold text-slate-400 uppercase">Current Stock Units</p>
            </div>
          </div>
          <div className="h-80 flex items-center justify-center">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={10}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-300 text-sm font-bold uppercase tracking-widest">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Health Grid */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 print:border-none print:shadow-none">
        <div className="flex justify-between items-center mb-10">
           <div>
              <h3 className="text-xl font-black text-slate-800">Real-Time Stock Health</h3>
              <p className="text-xs font-bold text-slate-400 uppercase">Monitoring critical levels</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {inventory.slice(0, 8).map(item => (
            <div key={item.id} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{item.category}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${item.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {item.quantity < 5 ? 'CRITICAL' : 'STABLE'}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 truncate mb-6 group-hover:text-indigo-600 transition-colors">{item.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-1">
                  <span className="text-slate-400">Stock Units</span>
                  <span className={`${item.quantity < 5 ? 'text-red-500' : 'text-slate-700'}`}>{item.quantity}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.quantity < 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((item.quantity / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
