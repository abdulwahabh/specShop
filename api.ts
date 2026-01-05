
import { InventoryItem, Sale, Supplier, SaleStatus } from './types';

const API_BASE = 'http://localhost:3000/api';

export const api = {
  // --- Auth ---
  async login(email: string, password: string): Promise<{name: string} | null> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('opti_session', JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) { console.error("Login failed", e); }
    return null;
  },

  checkSession(): {name: string} | null {
    const saved = localStorage.getItem('opti_session');
    return saved ? JSON.parse(saved) : null;
  },

  logout(): void {
    localStorage.removeItem('opti_session');
  },

  // --- Suppliers ---
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE}/suppliers`);
    return res.json();
  },

  async addSupplier(sup: Omit<Supplier, 'id'>): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sup)
    });
    return res.json();
  },

  async updateSupplier(id: string, data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch(`${API_BASE}/inventory`);
    return res.json();
  },

  async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async updateStock(itemId: string, quantityChange: number): Promise<void> {
    await fetch(`${API_BASE}/inventory/${itemId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantityChange })
    });
  },

  // --- Sales ---
  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`);
    return res.json();
  },

  async processSale(saleData: Omit<Sale, 'id' | 'date' | 'balance'>): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    return res.json();
  },

  async updateSaleStatus(saleId: string, status: SaleStatus, paymentReceived: number = 0): Promise<void> {
    const numericId = saleId.includes('INV-') ? saleId.replace('INV-', '') : saleId;
    await fetch(`${API_BASE}/sales/${numericId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paymentReceived })
    });
  }
};
