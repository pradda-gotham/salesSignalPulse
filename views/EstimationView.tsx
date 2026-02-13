
import React, { useState, useCallback, useMemo } from 'react';
import {
    ArrowLeft,
    Package,
    HardHat,
    Wrench,
    Truck,
    Building2,
    ChevronDown,
    ChevronUp,
    Loader2,
    Sparkles,
    AlertCircle,
    RefreshCw,
    ShieldCheck,
    Edit3,
    Check,
    X,
    Info,
    Calculator
} from 'lucide-react';
import { CostEstimation, CostCategory, CostLineItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface EstimationViewProps {
    estimation: CostEstimation | null;
    accountName: string;
    signalHeadline: string;
    isLoading: boolean;
    error?: string | null;
    onRetry: () => void;
    onBack: () => void;
}

const CATEGORY_CONFIG = [
    { key: 'materials' as const, label: 'Materials', icon: Package, color: '#6C5DD3' },
    { key: 'labour' as const, label: 'Labour', icon: HardHat, color: '#00C4FF' },
    { key: 'subContractors' as const, label: 'Sub-Contractors', icon: Wrench, color: '#10B981' },
    { key: 'equipment' as const, label: 'Equipment', icon: Truck, color: '#F59E0B' },
    { key: 'overhead' as const, label: 'Overhead', icon: Building2, color: '#FF5F5F' },
];

type CategoryKey = typeof CATEGORY_CONFIG[number]['key'];

const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
};

const formatFullCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const EstimationView: React.FC<EstimationViewProps> = ({
    estimation: initialEstimation,
    accountName,
    signalHeadline,
    isLoading,
    error,
    onRetry,
    onBack
}) => {
    const { isDarkMode } = useTheme();
    const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(new Set(['materials']));
    const [contingency, setContingency] = useState(initialEstimation?.contingency ?? 10);
    const [editingCell, setEditingCell] = useState<{ category: CategoryKey; itemIndex: number; field: 'quantity' | 'unitRate' } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Local estimation state for inline edits
    const [localEstimation, setLocalEstimation] = useState<CostEstimation | null>(initialEstimation);

    // Sync when new estimation arrives
    React.useEffect(() => {
        if (initialEstimation) {
            setLocalEstimation(initialEstimation);
            setContingency(initialEstimation.contingency);
        }
    }, [initialEstimation]);

    const estimation = localEstimation;

    // Recalculate totals
    const computedTotals = useMemo(() => {
        if (!estimation) return null;
        const totalDirect = estimation.materials.total + estimation.labour.total +
            estimation.subContractors.total + estimation.equipment.total;
        const totalIndirect = estimation.overhead.total;
        const grand = totalDirect + totalIndirect;
        const final = grand * (1 + contingency / 100);
        return { totalDirect, totalIndirect, grand, final };
    }, [estimation, contingency]);

    const toggleCategory = useCallback((key: CategoryKey) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }, []);

    const startEditing = useCallback((category: CategoryKey, itemIndex: number, field: 'quantity' | 'unitRate', currentValue: number) => {
        setEditingCell({ category, itemIndex, field });
        setEditValue(String(currentValue));
    }, []);

    const saveEdit = useCallback(() => {
        if (!editingCell || !estimation) return;
        const newValue = parseFloat(editValue);
        if (isNaN(newValue) || newValue < 0) {
            setEditingCell(null);
            return;
        }

        setLocalEstimation(prev => {
            if (!prev) return prev;
            const cat = { ...prev[editingCell.category] };
            const items = [...cat.items];
            const item = { ...items[editingCell.itemIndex] };

            item[editingCell.field] = newValue;
            item.amount = item.quantity * item.unitRate;
            item.isAdjusted = true;
            items[editingCell.itemIndex] = item;
            cat.items = items;
            cat.total = items.reduce((sum, i) => sum + i.amount, 0);

            return { ...prev, [editingCell.category]: cat };
        });

        setEditingCell(null);
    }, [editingCell, editValue, estimation]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setEditValue('');
    }, []);

    // Chart data
    const chartData = useMemo(() => {
        if (!estimation) return [];
        return CATEGORY_CONFIG.map(c => ({
            name: c.label,
            value: estimation[c.key].total,
            color: c.color
        }));
    }, [estimation]);

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500 px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Estimation Failed</h2>
                    <p className={`max-w-md mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                        {error || "An unexpected error occurred during cost estimation."}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onBack} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-[#1B1D21] border-slate-200'}`}>
                        Back to Dossier
                    </button>
                    <button onClick={onRetry} className="px-6 py-2.5 bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#6C5DD3]/20">
                        <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading || !estimation || !computedTotals) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-[#6C5DD3]/10 flex items-center justify-center">
                        <Calculator className="w-10 h-10 text-[#6C5DD3]" />
                    </div>
                    <Loader2 className="w-6 h-6 text-[#6C5DD3] animate-spin absolute -bottom-1 -right-1" />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>Generating Cost Estimation</h2>
                    <p className={`text-sm max-w-md mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                        AI is analyzing the opportunity and searching for current regional market rates...
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6C5DD3] font-bold animate-pulse">
                    <Sparkles className="w-4 h-4" /> Researching prices, rates & benchmarks
                </div>
            </div>
        );
    }

    const confidenceColor = estimation.confidence === 'high'
        ? 'text-green-500 bg-green-500/10 border-green-500/20'
        : estimation.confidence === 'medium'
            ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            : 'text-red-500 bg-red-500/10 border-red-500/20';

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-20 font-sans">

            {/* Back Navigation */}
            <button
                onClick={onBack}
                className={`flex items-center gap-2 text-sm font-medium transition-colors group ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-[#808191] hover:text-[#1B1D21]'}`}
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dossier
            </button>

            {/* Header */}
            <div className={`flex items-start justify-between border-b pb-8 ${isDarkMode ? 'border-white/5' : 'border-slate-200/60'}`}>
                <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 bg-[#6C5DD3]/10 text-[#6C5DD3] border-[#6C5DD3]/20`}>
                            <Calculator className="w-3 h-3" />
                            Cost Estimation
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${confidenceColor}`}>
                            <ShieldCheck className="w-3 h-3" />
                            {estimation.confidence} Confidence
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isDarkMode ? 'bg-white/5 text-zinc-400 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {estimation.projectType}
                        </div>
                    </div>
                    <div>
                        <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                            {accountName}
                        </h1>
                        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}`}>
                            <span className="opacity-50">Signal:</span>
                            <span className={isDarkMode ? 'text-zinc-300' : 'text-[#50515e]'}>"{signalHeadline}"</span>
                        </div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>
                            Scale: {estimation.projectScale} · Region: {estimation.region}
                        </div>
                    </div>
                </div>

                {/* Final Estimate */}
                <div className="text-right min-w-[180px]">
                    <div className={`text-[10px] font-bold uppercase mb-1 tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                        Final Estimate
                    </div>
                    <div className={`text-4xl font-mono font-bold flex items-center justify-end ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                        <span className="text-[#6C5DD3] mr-1">$</span>
                        {(computedTotals.final / 1000).toFixed(0)}k
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-600' : 'text-[#aaa]'}`}>
                        incl. {contingency}% contingency
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Cost Category Sections */}
                    {CATEGORY_CONFIG.map((config) => {
                        const category = estimation[config.key];
                        const isExpanded = expandedCategories.has(config.key);
                        const percentage = computedTotals.grand > 0 ? ((category.total / computedTotals.grand) * 100).toFixed(1) : '0';

                        return (
                            <section key={config.key} className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(config.key)}
                                    className={`w-full flex items-center justify-between p-5 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                                            <config.icon className="w-5 h-5" style={{ color: config.color }} />
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{config.label}</div>
                                            <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>{category.items.length} line items · {percentage}%</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-sm" style={{ color: config.color }}>
                                            {formatFullCurrency(category.total)}
                                        </span>
                                        {isExpanded ? <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`} /> : <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`} />}
                                    </div>
                                </button>

                                {/* Expanded Line Items */}
                                {isExpanded && (
                                    <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                        {category.notes && (
                                            <div className={`px-5 py-2 text-xs flex items-center gap-2 ${isDarkMode ? 'bg-white/[0.02] text-zinc-500' : 'bg-slate-50/50 text-[#808191]'}`}>
                                                <Info className="w-3 h-3 flex-shrink-0" /> {category.notes}
                                            </div>
                                        )}
                                        <table className="w-full text-left text-sm">
                                            <thead className={`font-bold uppercase tracking-wider text-[10px] border-b ${isDarkMode ? 'bg-white/[0.02] text-zinc-600 border-white/5' : 'bg-slate-50/50 text-[#808191] border-slate-100'}`}>
                                                <tr>
                                                    <th className="px-5 py-3">Description</th>
                                                    <th className="px-5 py-3 text-right w-20">Unit</th>
                                                    <th className="px-5 py-3 text-right w-24">Qty</th>
                                                    <th className="px-5 py-3 text-right w-28">Rate</th>
                                                    <th className="px-5 py-3 text-right w-32">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-50'}`}>
                                                {category.items.map((item, idx) => (
                                                    <tr key={idx} className={`group ${item.isAdjusted ? (isDarkMode ? 'bg-[#6C5DD3]/5' : 'bg-[#6C5DD3]/[0.02]') : ''} ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/70'}`}>
                                                        <td className={`px-5 py-3 ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                {item.description}
                                                                {item.isAdjusted && <span className="text-[9px] font-bold text-[#6C5DD3] bg-[#6C5DD3]/10 px-1 py-0.5 rounded">EDITED</span>}
                                                            </div>
                                                        </td>
                                                        <td className={`px-5 py-3 text-right text-xs ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>{item.unit}</td>

                                                        {/* Editable Quantity */}
                                                        <td className="px-5 py-3 text-right">
                                                            {editingCell?.category === config.key && editingCell.itemIndex === idx && editingCell.field === 'quantity' ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                                                        className={`w-20 text-right text-xs rounded px-1.5 py-1 border outline-none ${isDarkMode ? 'bg-white/10 border-[#6C5DD3]/30 text-white' : 'bg-white border-[#6C5DD3]/30 text-[#1B1D21]'}`}
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check className="w-3 h-3" /></button>
                                                                    <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    onClick={() => startEditing(config.key, idx, 'quantity', item.quantity)}
                                                                    className={`cursor-pointer group-hover:text-[#6C5DD3] transition-colors inline-flex items-center gap-1 ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}
                                                                >
                                                                    {item.quantity.toLocaleString()}
                                                                    <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Editable Rate */}
                                                        <td className="px-5 py-3 text-right">
                                                            {editingCell?.category === config.key && editingCell.itemIndex === idx && editingCell.field === 'unitRate' ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                                                        className={`w-24 text-right text-xs rounded px-1.5 py-1 border outline-none ${isDarkMode ? 'bg-white/10 border-[#6C5DD3]/30 text-white' : 'bg-white border-[#6C5DD3]/30 text-[#1B1D21]'}`}
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check className="w-3 h-3" /></button>
                                                                    <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    onClick={() => startEditing(config.key, idx, 'unitRate', item.unitRate)}
                                                                    className={`cursor-pointer group-hover:text-[#6C5DD3] transition-colors font-mono text-xs inline-flex items-center gap-1 ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}
                                                                >
                                                                    ${item.unitRate.toLocaleString()}
                                                                    <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className={`px-5 py-3 text-right font-mono font-bold text-xs ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                                                            {formatFullCurrency(item.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Cost Distribution Chart */}
                    <section className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
                        <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                            Cost Distribution
                        </div>

                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload?.[0]) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className={`px-3 py-2 rounded-lg text-xs font-bold shadow-lg border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-[#1B1D21]'}`}>
                                                        {d.name}: {formatCurrency(d.value)}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2 mt-2">
                            {CATEGORY_CONFIG.map(c => {
                                const cat = estimation[c.key];
                                const pct = computedTotals.grand > 0 ? ((cat.total / computedTotals.grand) * 100).toFixed(1) : '0';
                                return (
                                    <div key={c.key} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                                            <span className={isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}>{c.label}</span>
                                        </div>
                                        <span className={`font-mono font-bold ${isDarkMode ? 'text-zinc-300' : 'text-[#1B1D21]'}`}>{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Summary Totals */}
                    <section className={`p-6 rounded-2xl border shadow-sm space-y-4 ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
                        <div className={`font-bold uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                            Summary
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Direct Costs</span>
                                <span className={`font-mono font-bold ${isDarkMode ? 'text-zinc-200' : 'text-[#1B1D21]'}`}>{formatFullCurrency(computedTotals.totalDirect)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Indirect Costs</span>
                                <span className={`font-mono font-bold ${isDarkMode ? 'text-zinc-200' : 'text-[#1B1D21]'}`}>{formatFullCurrency(computedTotals.totalIndirect)}</span>
                            </div>
                            <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                            <div className="flex justify-between text-sm">
                                <span className={isDarkMode ? 'text-zinc-400' : 'text-[#808191]'}>Sub-Total</span>
                                <span className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>{formatFullCurrency(computedTotals.grand)}</span>
                            </div>
                        </div>

                        {/* Contingency Slider */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>Contingency</span>
                                <span className="text-sm font-mono font-bold text-[#6C5DD3]">{contingency}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                                value={contingency}
                                onChange={(e) => setContingency(parseInt(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#6C5DD3]"
                                style={{
                                    background: `linear-gradient(to right, #6C5DD3 0%, #6C5DD3 ${(contingency / 30) * 100}%, ${isDarkMode ? '#1f1f1f' : '#e2e8f0'} ${(contingency / 30) * 100}%, ${isDarkMode ? '#1f1f1f' : '#e2e8f0'} 100%)`
                                }}
                            />
                            <div className={`flex justify-between text-[10px] ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                                <span>0%</span>
                                <span>30%</span>
                            </div>
                        </div>

                        <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />

                        {/* Final Estimate */}
                        <div className={`flex justify-between items-center p-4 -mx-2 rounded-xl ${isDarkMode ? 'bg-[#6C5DD3]/10' : 'bg-[#6C5DD3]/5'}`}>
                            <span className="text-sm font-bold text-[#6C5DD3]">Final Estimate</span>
                            <span className={`text-xl font-mono font-black ${isDarkMode ? 'text-white' : 'text-[#1B1D21]'}`}>
                                {formatFullCurrency(computedTotals.final)}
                            </span>
                        </div>
                    </section>

                    {/* Assumptions */}
                    {estimation.assumptions.length > 0 && (
                        <section className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200/60'}`}>
                            <div className={`font-bold uppercase tracking-widest text-[10px] mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-[#808191]'}`}>
                                Key Assumptions
                            </div>
                            <ul className="space-y-2">
                                {estimation.assumptions.map((a, i) => (
                                    <li key={i} className={`text-xs leading-relaxed flex gap-2 ${isDarkMode ? 'text-zinc-400' : 'text-[#50515e]'}`}>
                                        <span className="text-[#6C5DD3] font-bold mt-0.5">•</span>
                                        {a}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Re-Estimate Button */}
                    <button
                        onClick={onRetry}
                        className={`w-full px-6 py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-[#1B1D21] border-slate-200'}`}
                    >
                        <RefreshCw className="w-4 h-4" /> Re-Estimate with AI
                    </button>
                </div>
            </div>

        </div>
    );
};

export default EstimationView;
