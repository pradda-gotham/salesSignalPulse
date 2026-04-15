
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Radar,
  Activity,
  Target,
  Zap,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Loader2,
  BarChart2,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  FileText,
} from 'lucide-react';
import { BusinessProfile, MarketSignal, DealDossier, SignalUrgency } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { geminiService } from '../services/geminiService';
import { priceValue } from '../utils/normalizeDossier';

// ── Types ──────────────────────────────────────────────────────────────────

interface IndustryTrend {
  title: string;
  impact: string;
  relevance: string;
  marketShift: 'bullish' | 'bearish' | 'neutral';
  sourceTitle?: string;
  sourceUrl?: string;
}

interface InsightsViewProps {
  profile: BusinessProfile;
  signals: MarketSignal[];
  dossierCache: Record<string, DealDossier>;
  onViewDossier: (signal: MarketSignal) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const INDUSTRY_COLORS = ['#6C5DD3', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
const LOCATION_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  New: { label: 'New', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  Contacted: { label: 'Contacted', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  'Followed-up': { label: 'Followed Up', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  'Meeting Booked': { label: 'Meeting', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  Archived: { label: 'Archived', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

const URGENCY_DOT: Record<string, string> = {
  EMERGENCY: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-zinc-400',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function isThisYear(dateStr: string): boolean {
  try {
    return new Date(dateStr).getFullYear() === new Date().getFullYear();
  } catch {
    return false;
  }
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function getEstimatedValue(signal: MarketSignal, dossierCache: Record<string, DealDossier>): number {
  const dossier = dossierCache[signal.id];
  if (!dossier) return 0;
  return priceValue(dossier.pricingStrategy?.estimatedValue) || 0;
}

function getAccountName(signal: MarketSignal, dossierCache: Record<string, DealDossier>): string {
  const dossier = dossierCache[signal.id];
  return dossier?.accountName || signal.headline.split(':')[0] || 'Unknown Account';
}

// ── Sub-components ─────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  sub?: string;
  icon: React.ReactNode;
  isDarkMode: boolean;
}> = ({ label, value, delta, deltaUp, sub, icon, isDarkMode }) => (
  <div className={`relative p-7 rounded-[1.75rem] border transition-all group overflow-hidden ${
    isDarkMode
      ? 'bg-[#141414] border-white/5 hover:border-[#6C5DD3]/30'
      : 'bg-white border-gray-200 hover:border-[#6C5DD3]/40'
  }`}>
    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <div className="w-12 h-12 text-[#6C5DD3]">{icon}</div>
    </div>
    <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
      {label}
    </div>
    <div className={`text-4xl font-black tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {value}
    </div>
    <div className="flex items-center gap-2">
      {delta && (
        <span className={`text-xs font-bold ${deltaUp ? 'text-green-500' : deltaUp === false ? 'text-red-400' : 'text-[#6C5DD3]'}`}>
          {delta}
        </span>
      )}
      {sub && <span className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{sub}</span>}
    </div>
  </div>
);

const TrendShiftBadge: React.FC<{ shift: IndustryTrend['marketShift'] }> = ({ shift }) => {
  if (shift === 'bullish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
      <TrendingUp className="w-3 h-3" /> Bullish
    </span>
  );
  if (shift === 'bearish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
      <TrendingDown className="w-3 h-3" /> Bearish
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
      <Minus className="w-3 h-3" /> Neutral
    </span>
  );
};

const CustomBarTooltip: React.FC<any> = ({ active, payload, label, isDarkMode }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-4 py-3 rounded-2xl border shadow-xl text-xs ${isDarkMode ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className="font-bold mb-1 truncate max-w-[180px]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className={isDarkMode ? 'text-zinc-400' : 'text-gray-500'}>{p.name}:</span>
          <span className="font-mono font-bold">{p.name === 'Value' ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const InsightsView: React.FC<InsightsViewProps> = ({ profile, signals, dossierCache, onViewDossier }) => {
  const { isDarkMode } = useTheme();
  const [trends, setTrends] = useState<IndustryTrend[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [trendsLoaded, setTrendsLoaded] = useState(false);
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [opportunitySort, setOpportunitySort] = useState<'score' | 'value' | 'date'>('score');

  // ── Derived KPI values ──────────────────────────────────────────────────

  const ytdSignals = useMemo(() =>
    signals.filter(s => isThisYear(s.timestamp)),
    [signals]
  );

  const totalPipelineValue = useMemo(() =>
    signals.reduce((sum, s) => sum + getEstimatedValue(s, dossierCache), 0),
    [signals, dossierCache]
  );

  const highIntentCount = useMemo(() =>
    signals.filter(s => s.urgency === SignalUrgency.HIGH || s.urgency === SignalUrgency.EMERGENCY).length,
    [signals]
  );

  const unclaimedCount = useMemo(() =>
    signals.filter(s => s.status === 'New').length,
    [signals]
  );

  // ── Industry chart data (grouped by matched product) ───────────────────

  const industryChartData = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    signals.forEach(s => {
      const key = s.matchedProducts?.[0] || profile.targetGroups?.[0] || 'General';
      const label = key.length > 22 ? key.slice(0, 22) + '…' : key;
      if (!map[label]) map[label] = { count: 0, value: 0 };
      map[label].count += 1;
      map[label].value += getEstimatedValue(s, dossierCache);
    });
    return Object.entries(map)
      .map(([name, { count, value }]) => ({ name, Signals: count, Value: Math.round(value) }))
      .sort((a, b) => b.Value - a.Value || b.Signals - a.Signals)
      .slice(0, 7);
  }, [signals, dossierCache, profile]);

  // ── Location chart data (grouped by region) ────────────────────────────

  const locationChartData = useMemo(() => {
    const map: Record<string, number> = {};
    signals.forEach(s => {
      const region = s.region?.trim() || 'Unknown';
      // Shorten long region strings
      const key = region.length > 20 ? region.slice(0, 20) + '…' : region;
      map[key] = (map[key] || 0) + 1;
    });

    // Fallback: if all 'Unknown', derive from profile geography
    const allUnknown = Object.keys(map).every(k => k === 'Unknown' || k === 'Unknown…');
    if (allUnknown && profile.geography.length > 0) {
      profile.geography.forEach(g => { map[g] = map['Unknown'] || 1; });
      delete map['Unknown'];
    }

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [signals, profile]);

  // ── Opportunity list ────────────────────────────────────────────────────

  const sortedOpportunities = useMemo(() => {
    let list = [...signals];

    if (opportunitySearch.trim()) {
      const q = opportunitySearch.toLowerCase();
      list = list.filter(s =>
        s.headline.toLowerCase().includes(q) ||
        s.decisionMaker?.toLowerCase().includes(q) ||
        getAccountName(s, dossierCache).toLowerCase().includes(q)
      );
    }

    if (opportunitySort === 'score') list.sort((a, b) => b.score - a.score);
    else if (opportunitySort === 'value') list.sort((a, b) => getEstimatedValue(b, dossierCache) - getEstimatedValue(a, dossierCache));
    else list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return list;
  }, [signals, dossierCache, opportunitySearch, opportunitySort]);

  // ── Fetch industry trends ───────────────────────────────────────────────

  const fetchTrends = async (force = false) => {
    if ((trendsLoaded && !force) || isFetchingTrends) return;
    setIsFetchingTrends(true);
    setTrendsError(null);
    try {
      const data = await geminiService.getIndustryTrends(profile);
      setTrends(data);
      setTrendsLoaded(true);
    } catch (e: any) {
      console.error('[INSIGHTS] Failed to load trends:', e);
      setTrendsError('Could not load trends at this time. Please try refreshing.');
    } finally {
      setIsFetchingTrends(false);
    }
  };

  useEffect(() => {
    if (profile?.industry) fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.industry]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Market Intelligence Hub
          </h1>
          <p className={`text-base font-medium italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Live signal analytics for <span className="not-italic font-bold text-[#6C5DD3]">{profile.name}</span>
          </p>
        </div>
        <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
          isDarkMode
            ? 'bg-[#141414] hover:bg-white/10 text-white border-white/10'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
        }`}>
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Leads (YTD)"
          value={ytdSignals.length.toString()}
          delta={signals.length > 0 ? `${signals.length} all-time` : undefined}
          sub="leads captured this year"
          icon={<Calendar className="w-full h-full" />}
          isDarkMode={isDarkMode}
        />
        <KpiCard
          label="Active Pipeline"
          value={totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : signals.length > 0 ? 'Pending' : '—'}
          delta={totalPipelineValue > 0 ? `${Object.keys(dossierCache).length} dossiers valued` : undefined}
          sub={totalPipelineValue === 0 && signals.length > 0 ? 'generate dossiers to see value' : undefined}
          icon={<DollarSign className="w-full h-full" />}
          isDarkMode={isDarkMode}
        />
        <KpiCard
          label="High-Intent Signals"
          value={highIntentCount.toString()}
          delta={highIntentCount > 0 ? 'Needs attention' : undefined}
          sub={`of ${signals.length} total signals`}
          icon={<Zap className="w-full h-full" />}
          isDarkMode={isDarkMode}
        />
        <KpiCard
          label="Unclaimed Leads"
          value={unclaimedCount.toString()}
          delta={unclaimedCount > 0 ? 'Requires Action' : unclaimedCount === 0 && signals.length > 0 ? 'All engaged ✓' : undefined}
          deltaUp={unclaimedCount === 0 && signals.length > 0 ? true : undefined}
          sub="status: New"
          icon={<AlertCircle className="w-full h-full" />}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* By Industry/Product */}
        <div className={`lg:col-span-8 p-8 rounded-[2rem] border ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6C5DD3]/10 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-[#6C5DD3]" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Value of Opportunity by Sector
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Pipeline value & signal count by matched industry / product
                </p>
              </div>
            </div>
          </div>

          {industryChartData.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-[280px] gap-3 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <BarChart2 className={`w-10 h-10 ${isDarkMode ? 'text-zinc-700' : 'text-gray-200'}`} />
              <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                No signals yet — run a Live Hunt to populate this chart
              </p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#222' : '#f0f0f0'} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={isDarkMode ? '#555' : '#9ca3af'}
                    fontSize={11}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={(props) => <CustomBarTooltip {...props} isDarkMode={isDarkMode} />} />
                  <Bar dataKey="Signals" radius={[0, 4, 4, 0]} maxBarSize={14}>
                    {industryChartData.map((_, i) => (
                      <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} fillOpacity={0.5} />
                    ))}
                  </Bar>
                  <Bar dataKey="Value" radius={[0, 6, 6, 0]} maxBarSize={14}>
                    {industryChartData.map((_, i) => (
                      <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* By Location */}
        <div className={`lg:col-span-4 p-8 rounded-[2rem] border ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>By Location</h3>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>Signal density by territory</p>
            </div>
          </div>

          {locationChartData.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-[240px] gap-3 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <MapPin className={`w-10 h-10 ${isDarkMode ? 'text-zinc-700' : 'text-gray-200'}`} />
              <p className={`text-xs font-medium text-center ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                No location data yet
              </p>
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {locationChartData.map((_, i) => (
                        <Cell key={i} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDarkMode ? '#fff' : '#111827',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {locationChartData.map((item, i) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-2 truncate ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LOCATION_COLORS[i % LOCATION_COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className={`font-bold ml-2 flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Opportunity List ────────────────────────────────────────────── */}
      <div className={`rounded-[2rem] border overflow-hidden ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b flex flex-col sm:flex-row sm:items-center gap-4 ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#6C5DD3]/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#6C5DD3]" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                All Opportunities
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                {signals.length} signal{signals.length !== 1 ? 's' : ''} — click any row to open the full dossier
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search opportunities…"
              value={opportunitySearch}
              onChange={e => setOpportunitySearch(e.target.value)}
              className={`px-4 py-2 rounded-xl text-sm border outline-none transition-all w-48 ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#6C5DD3]/40'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#6C5DD3]/50'
              }`}
            />
            <select
              value={opportunitySort}
              onChange={e => setOpportunitySort(e.target.value as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="score">Sort: Score</option>
              <option value="value">Sort: Value</option>
              <option value="date">Sort: Date</option>
            </select>
          </div>
        </div>

        {/* Empty state */}
        {signals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Target className={`w-14 h-14 ${isDarkMode ? 'text-zinc-700' : 'text-gray-200'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
              No opportunities yet — run a Live Hunt to discover signals
            </p>
          </div>
        )}

        {/* Table */}
        {sortedOpportunities.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead>
                <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                  isDarkMode ? 'text-zinc-500 border-white/5 bg-white/[0.02]' : 'text-gray-400 border-gray-100 bg-gray-50/50'
                }`}>
                  <th className="px-6 py-3.5">Account</th>
                  <th className="px-6 py-3.5">Signal</th>
                  <th className="px-6 py-3.5 text-right">Est. Value</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Score</th>
                  <th className="px-6 py-3.5 text-center">Urgency</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/[0.04]' : 'divide-gray-100'}`}>
                {sortedOpportunities.map((signal, idx) => {
                  const estValue = getEstimatedValue(signal, dossierCache);
                  const accountName = getAccountName(signal, dossierCache);
                  const statusCfg = STATUS_CONFIG[signal.status] || STATUS_CONFIG['New'];
                  const urgencyDot = URGENCY_DOT[signal.urgency] || URGENCY_DOT['LOW'];
                  const hasDossier = !!dossierCache[signal.id];

                  return (
                    <tr
                      key={signal.id}
                      onClick={() => onViewDossier(signal)}
                      className={`group cursor-pointer transition-all animate-in fade-in duration-300 ${
                        isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-[#6C5DD3]/[0.03]'
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Account */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                            isDarkMode ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : 'bg-[#6C5DD3]/5 text-[#6C5DD3]'
                          }`}>
                            {accountName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold text-sm truncate max-w-[150px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {accountName}
                            </div>
                            {signal.region && (
                              <div className={`text-[10px] truncate max-w-[150px] ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                                {signal.region}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Signal headline */}
                      <td className="px-6 py-4 max-w-[260px]">
                        <p className={`text-sm leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                          {signal.headline}
                        </p>
                      </td>

                      {/* Value */}
                      <td className="px-6 py-4 text-right">
                        {estValue > 0 ? (
                          <span className="font-mono font-bold text-[#6C5DD3] text-sm">
                            {formatCurrency(estValue)}
                          </span>
                        ) : hasDossier ? (
                          <span className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-gray-300'}`}>—</span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-gray-100 text-gray-400'
                          }`}>
                            Generate
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
                            signal.score >= 80
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : signal.score >= 60
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>
                            {signal.score}
                          </div>
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${urgencyDot}`} />
                          {signal.urgency}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className={`w-4 h-4 transition-all group-hover:translate-x-1 ${isDarkMode ? 'text-zinc-600 group-hover:text-[#6C5DD3]' : 'text-gray-300 group-hover:text-[#6C5DD3]'}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* No search results */}
        {signals.length > 0 && sortedOpportunities.length === 0 && (
          <div className="py-12 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
              No opportunities match "<strong>{opportunitySearch}</strong>"
            </p>
          </div>
        )}
      </div>

      {/* ── Industry Trends ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-[#6C5DD3]/20' : 'bg-[#6C5DD3]/10'}`}>
              <Activity className="w-5 h-5 text-[#6C5DD3]" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Latest Industry Trends
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                How market shifts are shaping opportunities for {profile.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchTrends(true)}
            disabled={isFetchingTrends}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTrends ? 'animate-spin' : ''}`} />
            {isFetchingTrends ? 'Fetching…' : 'Refresh'}
          </button>
        </div>

        {/* Loading skeleton */}
        {isFetchingTrends && (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`p-6 rounded-2xl border animate-pulse ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'}`}>
                <div className={`w-24 h-3 rounded-full mb-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                <div className={`w-3/4 h-5 rounded-full mb-2 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                <div className={`w-full h-4 rounded-full mb-1.5 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                <div className={`w-2/3 h-4 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isFetchingTrends && trendsError && (
          <div className={`p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{trendsError}</p>
          </div>
        )}

        {/* Trends grid */}
        {!isFetchingTrends && trends.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            {trends.map((trend, i) => (
              <div
                key={i}
                className={`p-7 rounded-[1.75rem] border group transition-all ${
                  isDarkMode
                    ? 'bg-[#141414] border-white/5 hover:border-[#6C5DD3]/20'
                    : 'bg-white border-gray-200 hover:border-[#6C5DD3]/30'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    trend.marketShift === 'bullish' ? 'bg-green-500/10' :
                    trend.marketShift === 'bearish' ? 'bg-red-500/10' : 'bg-zinc-500/10'
                  }`}>
                    {trend.marketShift === 'bullish'
                      ? <TrendingUp className="w-5 h-5 text-green-500" />
                      : trend.marketShift === 'bearish'
                        ? <TrendingDown className="w-5 h-5 text-red-400" />
                        : <Minus className="w-5 h-5 text-zinc-400" />
                    }
                  </div>
                  <TrendShiftBadge shift={trend.marketShift} />
                </div>

                <h4 className={`font-black text-base leading-snug mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {trend.title}
                </h4>

                <p className={`text-sm leading-relaxed mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  {trend.impact}
                </p>

                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isDarkMode ? 'bg-[#6C5DD3]/5 border-[#6C5DD3]/10 text-zinc-300' : 'bg-[#6C5DD3]/5 border-[#6C5DD3]/10 text-gray-700'
                }`}>
                  <span className="text-[#6C5DD3] font-bold">For {profile.name}: </span>
                  {trend.relevance}
                </div>

                {trend.sourceUrl && (
                  <a
                    href={trend.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 mt-4 text-[10px] font-bold hover:text-[#6C5DD3] transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {trend.sourceTitle || 'Source'}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Not yet loaded (no signals to trigger auto-load) */}
        {!isFetchingTrends && !trendsError && trends.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-16 gap-4 rounded-[2rem] border border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <Radar className={`w-12 h-12 ${isDarkMode ? 'text-zinc-700' : 'text-gray-200'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
              Click <strong>Refresh</strong> to load current industry trends for {profile.industry}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default InsightsView;
