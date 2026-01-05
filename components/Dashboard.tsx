
import React from 'react';
import { InventoryItem, Sale, SaleStatus } from '../types';
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, sales }) => {
  const activeSales = sales.filter(s => s.status !== SaleStatus.CANCELLED);
  const totalRevenue = activeSales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalSales = activeSales.length;
  const totalInventory = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalBalance = activeSales.reduce((acc, s) => acc + s.balance, 0);

  const salesData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 6000 },
    { name: 'Thu', sales: 8000 },
    { name: 'Fri', sales: 5000 },
    { name: 'Sat', sales: 9000 },
    { name: 'Sun', sales: 7000 },
  ];

  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <IndianRupee size={24} />
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" />
              +12%
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
              <ShoppingBag size={24} />
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" />
              +5.4%
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Sales</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalSales}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
              <Package size={24} />
            </div>
            <span className="text-orange-500 text-xs font-bold flex items-center bg-orange-50 px-2 py-1 rounded-full">
              Stock Units
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Inventory</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalInventory}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-50 p-3 rounded-xl text-red-600">
              <Users size={24} />
            </div>
            <span className="text-red-500 text-xs font-bold flex items-center bg-red-50 px-2 py-1 rounded-full">
              Due
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Pending Balance</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{totalBalance.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Sales Performance</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {sale.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{sale.customerName}</h4>
                    <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800">₹{sale.totalPrice}</span>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full inline-block ${
                    sale.status === SaleStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                    sale.status === SaleStatus.CANCELLED ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {sale.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
