import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package, DollarSign, Save, X, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProductCatalogItem, RateCardEntry } from '../types';

interface CatalogViewProps {
  catalog: ProductCatalogItem[];
  rateCards: RateCardEntry[];
  onAddCatalogItem: (item: { sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => Promise<any>;
  onUpdateCatalogItem: (item: { id: string; sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => Promise<any>;
  onRemoveCatalogItem: (id: string) => Promise<boolean>;
  onAddRateCardEntry: (entry: { category: string; description: string; unit: string; defaultRate: number; region?: string }) => Promise<any>;
  onUpdateRateCardEntry: (entry: { id: string; category: string; description: string; unit: string; defaultRate: number; region?: string }) => Promise<any>;
  onRemoveRateCardEntry: (id: string) => Promise<boolean>;
}

type SubTab = 'products' | 'rate-cards';

const RATE_CARD_CATEGORIES = [
  { value: 'labour', label: 'Labour' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'subContractors', label: 'Sub-Contractors' },
  { value: 'materials', label: 'Materials' },
] as const;

const EMPTY_PRODUCT = { sku: '', name: '', description: '', category: 'General', unitPrice: 0, costBasis: 0, unit: 'each' };
const EMPTY_RATE_CARD = { category: 'labour', description: '', unit: 'hr', defaultRate: 0, region: '' };

const CatalogView: React.FC<CatalogViewProps> = ({
  catalog, rateCards,
  onAddCatalogItem, onUpdateCatalogItem, onRemoveCatalogItem,
  onAddRateCardEntry, onUpdateRateCardEntry, onRemoveRateCardEntry,
}) => {
  const { isDarkMode } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>('products');

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [productSaving, setProductSaving] = useState(false);

  // Rate card form state
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<RateCardEntry | null>(null);
  const [rateForm, setRateForm] = useState(EMPTY_RATE_CARD);
  const [rateSaving, setRateSaving] = useState(false);

  // CSV import state
  const [isImporting, setIsImporting] = useState(false);

  // ============ PRODUCT HANDLERS ============

  const handleOpenProductForm = (item?: ProductCatalogItem) => {
    if (item) {
      setEditingProduct(item);
      setProductForm({
        sku: item.sku,
        name: item.name,
        description: item.description,
        category: item.category,
        unitPrice: item.unitPrice,
        costBasis: item.costBasis || 0,
        unit: item.unit,
      });
    } else {
      setEditingProduct(null);
      setProductForm(EMPTY_PRODUCT);
    }
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.sku || !productForm.name || productForm.unitPrice <= 0) return;
    setProductSaving(true);
    if (editingProduct) {
      await onUpdateCatalogItem({ id: editingProduct.id, ...productForm });
    } else {
      await onAddCatalogItem(productForm);
    }
    setProductSaving(false);
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
  };

  const handleDeleteProduct = async (id: string) => {
    await onRemoveCatalogItem(id);
  };

  // ============ RATE CARD HANDLERS ============

  const handleOpenRateForm = (entry?: RateCardEntry) => {
    if (entry) {
      setEditingRate(entry);
      setRateForm({
        category: entry.category,
        description: entry.description,
        unit: entry.unit,
        defaultRate: entry.defaultRate,
        region: entry.region || '',
      });
    } else {
      setEditingRate(null);
      setRateForm(EMPTY_RATE_CARD);
    }
    setShowRateForm(true);
  };

  const handleSaveRate = async () => {
    if (!rateForm.description || rateForm.defaultRate <= 0) return;
    setRateSaving(true);
    if (editingRate) {
      await onUpdateRateCardEntry({ id: editingRate.id, ...rateForm });
    } else {
      await onAddRateCardEntry(rateForm);
    }
    setRateSaving(false);
    setShowRateForm(false);
    setEditingRate(null);
    setRateForm(EMPTY_RATE_CARD);
  };

  const handleDeleteRate = async (id: string) => {
    await onRemoveRateCardEntry(id);
  };

  // ============ CSV IMPORT ============

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { setIsImporting(false); return; }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('sku');
    const nameIdx = headers.indexOf('name');
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('unit_price'));
    const catIdx = headers.indexOf('category');
    const descIdx = headers.indexOf('description');
    const unitIdx = headers.indexOf('unit');
    const costIdx = headers.findIndex(h => h.includes('cost'));

    if (skuIdx === -1 || nameIdx === -1 || priceIdx === -1) {
      alert('CSV must have columns: sku, name, and price (or unit_price)');
      setIsImporting(false);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (!cols[skuIdx] || !cols[nameIdx]) continue;
      await onAddCatalogItem({
        sku: cols[skuIdx],
        name: cols[nameIdx],
        unitPrice: parseFloat(cols[priceIdx]) || 0,
        category: catIdx >= 0 ? cols[catIdx] || 'General' : 'General',
        description: descIdx >= 0 ? cols[descIdx] || '' : '',
        unit: unitIdx >= 0 ? cols[unitIdx] || 'each' : 'each',
        costBasis: costIdx >= 0 ? parseFloat(cols[costIdx]) || undefined : undefined,
      });
    }

    setIsImporting(false);
    e.target.value = '';
  };

  // ============ STYLE HELPERS ============

  const cardBg = isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]/50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const labelCls = `block text-xs font-medium mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`;

  // ============ SUB TAB RENDERING ============

  const groupedRateCards = RATE_CARD_CATEGORIES.map(cat => ({
    ...cat,
    entries: rateCards.filter(r => r.category === cat.value),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog & Rate Cards</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Manage your product SKUs and standard rates for accurate, auditable pricing
          </p>
        </div>
      </div>

      {/* Sub-tab Toggle */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
        {[
          { id: 'products' as SubTab, label: 'Products', icon: Package, count: catalog.length },
          { id: 'rate-cards' as SubTab, label: 'Rate Cards', icon: DollarSign, count: rateCards.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === tab.id
                ? isDarkMode
                  ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]'
                  : 'bg-white text-[#6C5DD3] shadow-sm'
                : isDarkMode
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              subTab === tab.id
                ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]'
                : isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-gray-200 text-gray-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ============ PRODUCTS TAB ============ */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Actions bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenProductForm()}
              className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import CSV'}
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} disabled={isImporting} />
            </label>
          </div>

          {/* Product table */}
          {catalog.length === 0 ? (
            <div className={`border rounded-2xl p-12 text-center ${cardBg}`}>
              <Package className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-zinc-600' : 'text-gray-300'}`} />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Add your product catalog so AI-generated bundles use real SKUs and prices
              </p>
              <button
                onClick={() => handleOpenProductForm()}
                className="px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-white/5' : 'bg-gray-50'}>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>SKU</th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Name</th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Category</th>
                    <th className={`text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Unit Price</th>
                    <th className={`text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Cost Basis</th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Unit</th>
                    <th className={`text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {catalog.map(item => (
                    <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-gray-100 text-gray-600'}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                        {item.costBasis ? `$${item.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenProductForm(item)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProduct(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Product Form Modal */}
          {showProductForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowProductForm(false)}>
              <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${cardBg}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                  <button onClick={() => setShowProductForm(false)} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>SKU *</label>
                    <input className={inputCls} value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. HNG-HD-001" />
                  </div>
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input className={inputCls} value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Heavy Duty Hinge" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Description</label>
                    <input className={inputCls} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
                    <input className={inputCls} value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Hinges" />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <input className={inputCls} value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. each, box, m" />
                  </div>
                  <div>
                    <label className={labelCls}>Unit Price ($) *</label>
                    <input type="number" step="0.01" min="0" className={inputCls} value={productForm.unitPrice || ''} onChange={e => setProductForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Cost Basis ($)</label>
                    <input type="number" step="0.01" min="0" className={inputCls} value={productForm.costBasis || ''} onChange={e => setProductForm(f => ({ ...f, costBasis: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowProductForm(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={!productForm.sku || !productForm.name || productForm.unitPrice <= 0 || productSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" /> {productSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ RATE CARDS TAB ============ */}
      {subTab === 'rate-cards' && (
        <div className="space-y-4">
          {/* Actions bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenRateForm()}
              className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Add Rate
            </button>
          </div>

          {rateCards.length === 0 ? (
            <div className={`border rounded-2xl p-12 text-center ${cardBg}`}>
              <DollarSign className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-zinc-600' : 'text-gray-300'}`} />
              <h3 className="text-lg font-semibold mb-2">No rate cards yet</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Add your standard rates (labour, equipment, etc.) for accurate cost estimations
              </p>
              <button
                onClick={() => handleOpenRateForm()}
                className="px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium"
              >
                Add First Rate
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedRateCards.map(group => (
                group.entries.length > 0 && (
                  <div key={group.value} className={`border rounded-2xl overflow-hidden ${cardBg}`}>
                    <div className={`px-4 py-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-semibold">{group.label}</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className={isDarkMode ? 'bg-white/[0.02]' : 'bg-gray-50/50'}>
                          <th className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Description</th>
                          <th className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Unit</th>
                          <th className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Default Rate</th>
                          <th className={`text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Region</th>
                          <th className={`text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                        {group.entries.map(entry => (
                          <tr key={entry.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/50'}`}>
                            <td className="px-4 py-3 text-sm">{entry.description}</td>
                            <td className="px-4 py-3 text-sm font-mono">{entry.unit}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">${entry.defaultRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}/{entry.unit}</td>
                            <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>{entry.region || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleOpenRateForm(entry)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteRate(entry.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Rate Card Form Modal */}
          {showRateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowRateForm(false)}>
              <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${cardBg}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{editingRate ? 'Edit Rate' : 'Add Rate'}</h3>
                  <button onClick={() => setShowRateForm(false)} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Category *</label>
                    <select className={inputCls} value={rateForm.category} onChange={e => setRateForm(f => ({ ...f, category: e.target.value }))}>
                      {RATE_CARD_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Unit *</label>
                    <input className={inputCls} value={rateForm.unit} onChange={e => setRateForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. hr, day, each" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Description *</label>
                    <input className={inputCls} value={rateForm.description} onChange={e => setRateForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Electrician - Journeyman" />
                  </div>
                  <div>
                    <label className={labelCls}>Default Rate ($) *</label>
                    <input type="number" step="0.01" min="0" className={inputCls} value={rateForm.defaultRate || ''} onChange={e => setRateForm(f => ({ ...f, defaultRate: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Region (optional)</label>
                    <input className={inputCls} value={rateForm.region} onChange={e => setRateForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. NSW, VIC" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowRateForm(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRate}
                    disabled={!rateForm.description || rateForm.defaultRate <= 0 || rateSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" /> {rateSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogView;
