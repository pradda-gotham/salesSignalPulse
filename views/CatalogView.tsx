import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package, DollarSign, Save, X, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProductCatalogItem, RateCardEntry } from '../types';
import { getVL } from '../utils/vesper';

interface CatalogViewProps {
  catalog: ProductCatalogItem[];
  rateCards: RateCardEntry[];
  onAddCatalogItem: (item: { sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => Promise<any>;
  onUpdateCatalogItem: (item: { id: string; sku: string; name: string; description?: string; category?: string; unitPrice: number; costBasis?: number; unit?: string }) => Promise<any>;
  onRemoveCatalogItem: (id: string) => Promise<boolean>;
  onAddRateCardEntry: (entry: { category: string; description: string; unit: string; defaultRate: number; region?: string }) => Promise<any>;
  onUpdateRateCardEntry: (entry: { id: string; category: string; description: string; unit: string; defaultRate: number; region?: string }) => Promise<any>;
  onRemoveRateCardEntry: (id: string) => Promise<boolean>;
  isEmbedded?: boolean;
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
  onAddRateCardEntry, onUpdateRateCardEntry, onRemoveRateCardEntry, isEmbedded = false
}) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  
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

  const groupedRateCards = RATE_CARD_CATEGORIES.map(cat => ({
    ...cat,
    entries: rateCards.filter(r => r.category === cat.value),
  }));

  return (
    <div className={`mx-auto space-y-6 ${isEmbedded ? 'max-w-full' : 'max-w-6xl'}`}>
      {/* Header (Hidden if embedded) */}
      {!isEmbedded && (
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Product Catalog & Rate Cards</h1>
            <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>
              Manage your product SKUs and standard rates for accurate, auditable pricing
            </p>
          </div>
        </div>
      )}

      {/* Sub-tab Toggle */}
      <div className="flex gap-1 p-1 rounded-[6px] w-fit border" style={{ background: vl.surfaceMuted, borderColor: vl.border }}>
        {[
          { id: 'products' as SubTab, label: 'Products', icon: Package, count: catalog.length },
          { id: 'rate-cards' as SubTab, label: 'Rate Cards', icon: DollarSign, count: rateCards.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold transition-all rounded-[4px]"
            style={
              subTab === tab.id
                ? { background: vl.surface, color: vl.primary, boxShadow: vl.shadow }
                : { color: vl.textMuted }
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] border font-bold" style={{
              background: subTab === tab.id ? vl.primarySoft : vl.chipBg,
              color: subTab === tab.id ? vl.primary : vl.textMuted,
              borderColor: subTab === tab.id ? 'transparent' : vl.borderStrong
            }}>
              {tab.count}
            </span>
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
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <label className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-bold cursor-pointer transition-all border" style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}>
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import CSV'}
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} disabled={isImporting} />
            </label>
          </div>

          {/* Product table */}
          {catalog.length === 0 ? (
            <div className="border rounded-[6px] p-12 text-center vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
              <div className="w-12 h-12 rounded-[6px] flex items-center justify-center mx-auto mb-4" style={{ background: vl.chipBg, color: vl.textMuted }}>
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>No products yet</h3>
              <p className="text-[13px] mb-4" style={{ color: vl.textBody }}>
                Add your product catalog so AI-generated bundles use real SKUs and prices
              </p>
              <button
                onClick={() => handleOpenProductForm()}
                className="btn-primary px-4 py-2 text-xs font-bold"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className="border rounded-[6px] overflow-hidden vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
              <table className="w-full text-left">
                <thead className="label-caps border-b" style={{ background: vl.tableHeader, borderColor: vl.borderStrong, color: vl.textMuted }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                    <th className="text-right px-4 py-3 font-semibold">Cost Basis</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: vl.borderStrong }}>
                  {catalog.map(item => (
                    <tr key={item.id} className="transition-colors hover-row">
                      <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: vl.primary }}>{item.sku}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: vl.textMain }}>{item.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold border label-caps" style={{ background: vl.chipBg, color: vl.textMuted, borderColor: vl.borderStrong }}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-right font-mono font-bold" style={{ color: vl.textMain }}>${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-mono font-bold" style={{ color: vl.textMuted }}>
                        {item.costBasis ? `$${item.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: vl.textBody }}>{item.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenProductForm(item)} className="p-1.5 rounded-[4px] transition-colors" style={{ color: vl.textMuted }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProduct(item.id)} className="p-1.5 rounded-[4px] hover:bg-red-500/10 text-[#EF4444] transition-colors border border-transparent hover:border-red-500/20">
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
              <div className="w-full max-w-lg rounded-[6px] border p-6 shadow-2xl vl-card" style={{ background: vl.surface, borderColor: vl.border }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                  <button onClick={() => setShowProductForm(false)} className="p-1 rounded-[4px]" style={{ color: vl.textMuted }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>SKU *</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. HNG-HD-001" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Name *</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Heavy Duty Hinge" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Description</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Category</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Hinges" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Unit</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. each, box, m" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Unit Price ($) *</label>
                    <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.unitPrice || ''} onChange={e => setProductForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Cost Basis ($)</label>
                    <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={productForm.costBasis || ''} onChange={e => setProductForm(f => ({ ...f, costBasis: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: vl.borderStrong }}>
                  <button onClick={() => setShowProductForm(false)} className="px-4 py-2 rounded-[6px] text-xs font-bold border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textBody }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={!productForm.sku || !productForm.name || productForm.unitPrice <= 0 || productSaving}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Add Rate
            </button>
          </div>

          {rateCards.length === 0 ? (
            <div className="border rounded-[6px] p-12 text-center vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
              <div className="w-12 h-12 rounded-[6px] flex items-center justify-center mx-auto mb-4" style={{ background: vl.chipBg, color: vl.textMuted }}>
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>No rate cards yet</h3>
              <p className="text-[13px] mb-4" style={{ color: vl.textBody }}>
                Add your standard rates (labour, equipment, etc.) for accurate cost estimations
              </p>
              <button
                onClick={() => handleOpenRateForm()}
                className="btn-primary px-4 py-2 text-xs font-bold"
              >
                Add First Rate
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedRateCards.map(group => (
                group.entries.length > 0 && (
                  <div key={group.value} className="border rounded-[6px] overflow-hidden vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                    <div className="px-5 py-3 border-b" style={{ background: vl.tableHeader, borderColor: vl.borderStrong }}>
                      <h3 className="text-[13px] font-bold" style={{ color: vl.textMain }}>{group.label}</h3>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="label-caps border-b" style={{ borderColor: vl.borderStrong, color: vl.textMuted }}>
                          <th className="px-5 py-3 font-semibold">Description</th>
                          <th className="px-5 py-3 font-semibold">Unit</th>
                          <th className="text-right px-5 py-3 font-semibold">Default Rate</th>
                          <th className="px-5 py-3 font-semibold">Region</th>
                          <th className="text-right px-5 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ divideColor: vl.borderStrong }}>
                        {group.entries.map(entry => (
                          <tr key={entry.id} className="transition-colors hover-row">
                            <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: vl.textMain }}>{entry.description}</td>
                            <td className="px-5 py-3 text-xs font-mono" style={{ color: vl.textBody }}>{entry.unit}</td>
                            <td className="px-5 py-3 text-[13px] text-right font-mono font-bold" style={{ color: vl.textMain }}>${entry.defaultRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}/{entry.unit}</td>
                            <td className="px-5 py-3 text-[13px]" style={{ color: vl.textMuted }}>{entry.region || '—'}</td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleOpenRateForm(entry)} className="p-1.5 rounded-[4px] transition-colors" style={{ color: vl.textMuted }}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteRate(entry.id)} className="p-1.5 rounded-[4px] hover:bg-red-500/10 text-[#EF4444] transition-colors border border-transparent hover:border-red-500/20">
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
              <div className="w-full max-w-lg rounded-[6px] border p-6 shadow-2xl vl-card" style={{ background: vl.surface, borderColor: vl.border }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>{editingRate ? 'Edit Rate' : 'Add Rate'}</h3>
                  <button onClick={() => setShowRateForm(false)} className="p-1 rounded-[4px]" style={{ color: vl.textMuted }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Category *</label>
                    <select className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={rateForm.category} onChange={e => setRateForm(f => ({ ...f, category: e.target.value }))}>
                      {RATE_CARD_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Unit *</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={rateForm.unit} onChange={e => setRateForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. hr, day, each" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Description *</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={rateForm.description} onChange={e => setRateForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Electrician - Journeyman" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Default Rate ($) *</label>
                    <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-[4px] border text-[13px] font-mono focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={rateForm.defaultRate || ''} onChange={e => setRateForm(f => ({ ...f, defaultRate: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 label-caps" style={{ color: vl.textMuted }}>Region (optional)</label>
                    <input className="w-full px-3 py-2 rounded-[4px] border text-[13px] focus:outline-none focus:border-[#635BFF]" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textMain }} value={rateForm.region} onChange={e => setRateForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. NSW, VIC" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: vl.borderStrong }}>
                  <button onClick={() => setShowRateForm(false)} className="px-4 py-2 rounded-[6px] text-xs font-bold border" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong, color: vl.textBody }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRate}
                    disabled={!rateForm.description || rateForm.defaultRate <= 0 || rateSaving}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
