
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
  Calendar,
} from 'lucide-react';
import { BusinessProfile, MarketSignal, DealDossier, SignalUrgency } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { geminiService } from '../services/geminiService';
import { priceValue } from '../utils/normalizeDossier';
import { getVL } from '../utils/vesper';
import { exportSignalsToExcel } from '../utils/exportToExcel';

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

const INDUSTRY_COLORS = ['#635BFF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
const LOCATION_COLORS = ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  New: { label: 'New', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  Contacted: { label: 'Contacted', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  'Followed-up': { label: 'Followed Up', bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  'Meeting Booked': { label: 'Meeting', bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  Archived: { label: 'Archived', bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20' },
};

const URGENCY_DOT: Record<string, string> = {
  EMERGENCY: 'bg-[#EF4444]',
  HIGH: 'bg-[#F59E0B]',
  MEDIUM: 'bg-[#10B981]',
  LOW: 'bg-zinc-400',
};

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

const KpiCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  sub?: string;
  icon: React.ReactNode;
  isDarkMode: boolean;
}> = ({ label, value, delta, deltaUp, sub, icon, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  return (
    <div 
      className="relative p-6 rounded-[6px] border transition-all overflow-hidden vl-card group"
      style={{ background: vl.surface, borderColor: vl.border }}
    >
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-12 h-12" style={{ color: vl.primary }}>{icon}</div>
      </div>
      <div className="label-caps mb-3" style={{ color: vl.textMuted }}>
        {label}
      </div>
      <div className="text-3xl font-bold tracking-tighter mb-1" style={{ color: vl.textMain }}>
        {value}
      </div>
      <div className="flex items-center gap-2">
        {delta && (
          <span className={`text-[11px] font-bold ${deltaUp ? 'text-green-500' : deltaUp === false ? 'text-[#EF4444]' : 'text-[#635BFF]'}`}>
            {delta}
          </span>
        )}
        {sub && <span className="text-[11px]" style={{ color: vl.textBody }}>{sub}</span>}
      </div>
    </div>
  );
};

const TrendShiftBadge: React.FC<{ shift: IndustryTrend['marketShift'] }> = ({ shift }) => {
  if (shift === 'bullish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 label-caps">
      <TrendingUp className="w-3 h-3" /> Bullish
    </span>
  );
  if (shift === 'bearish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 label-caps">
      <TrendingDown className="w-3 h-3" /> Bearish
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 label-caps">
      <Minus className="w-3 h-3" /> Neutral
    </span>
  );
};

const CustomBarTooltip: React.FC<any> = ({ active, payload, label, isDarkMode }) => {
  const vl = getVL(isDarkMode);
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-[6px] border shadow-xl text-xs" style={{ background: vl.surface, borderColor: vl.border, color: vl.textMain }}>
      <div className="font-bold mb-1 truncate max-w-[180px]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span style={{ color: vl.textBody }}>{p.name}:</span>
          <span className="font-mono font-bold">{p.name === 'Value' ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const InsightsView: React.FC<InsightsViewProps> = ({ profile, signals, dossierCache, onViewDossier }) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [trends, setTrends] = useState<IndustryTrend[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [trendsLoaded, setTrendsLoaded] = useState(false);
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [opportunitySort, setOpportunitySort] = useState<'score' | 'value' | 'date'>('score');

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

  const industryChartData = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    signals.forEach(s => {
      // Look for the first matched property that isn't a product
      let key = s.matchedProducts?.find(mp => {
        const isProduct = profile.products?.some(p => 
          mp.toLowerCase().includes(p.toLowerCase()) || 
          p.toLowerCase().includes(mp.toLowerCase())
        );
        return !isProduct;
      });

      // If everything was a product, fallback to target groups or industry
      if (!key) {
        key = profile.targetGroups?.[0] || profile.industry || 'General';
      }
      
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

  const locationChartData = useMemo(() => {
    const map: Record<string, number> = {};
    
    // State extraction map for Australian locations
    const stateMap: Record<string, string> = {
      'nsw': 'NSW', 'new south wales': 'NSW', 'sydney': 'NSW',
      'vic': 'VIC', 'victoria': 'VIC', 'melbourne': 'VIC',
      'qld': 'QLD', 'queensland': 'QLD', 'brisbane': 'QLD',
      'wa': 'WA', 'western australia': 'WA', 'perth': 'WA',
      'sa': 'SA', 'south australia': 'SA', 'adelaide': 'SA',
      'tas': 'TAS', 'tasmania': 'TAS', 'hobart': 'TAS',
      'act': 'ACT', 'canberra': 'ACT',
      'nt': 'NT', 'northern territory': 'NT', 'darwin': 'NT'
    };
    
    // Create regex from keys
    const stateRegex = new RegExp(`\\b(${Object.keys(stateMap).join('|')})\\b`, 'i');

    signals.forEach(s => {
      let region = s.region?.trim() || 'Unknown';
      let matchedState = '';

      // 1. Try from dossier
      const dLocation = dossierCache[s.id]?.projectIntelligence?.location;
      if (dLocation) {
        const match = dLocation.match(stateRegex);
        if (match) matchedState = stateMap[match[0].toLowerCase()];
      }

      // 2. Try scanning headline and summary
      if (!matchedState) {
        const textToSearch = `${s.headline} ${s.summary}`;
        const match = textToSearch.match(stateRegex);
        if (match) matchedState = stateMap[match[0].toLowerCase()];
      }

      // Update region if we found a state
      if (matchedState) {
        region = matchedState;
      } else if (region.toLowerCase() === 'australia') {
        region = 'National';
      }

      const key = region.length > 20 ? region.slice(0, 20) + '…' : region;
      map[key] = (map[key] || 0) + 1;
    });

    const allUnknown = Object.keys(map).every(k => k === 'Unknown' || k === 'Unknown…');
    if (allUnknown && profile.geography.length > 0) {
      profile.geography.forEach(g => { map[g] = map['Unknown'] || 1; });
      delete map['Unknown'];
    }

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [signals, dossierCache, profile]);

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
  }, [profile?.industry]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
            Market Intelligence Hub
          </h1>
          <p className="text-[13px] italic" style={{ color: vl.textBody }}>
            Live signal analytics for <span className="not-italic font-bold" style={{ color: vl.primary }}>{profile.name}</span>
          </p>
        </div>
        <button 
          onClick={() => exportSignalsToExcel(signals, dossierCache)}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-bold border transition-all" 
          style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}
        >
          <Download className="w-3.5 h-3.5" /> Export Report
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads (YTD)" value={ytdSignals.length.toString()} delta={signals.length > 0 ? `${signals.length} all-time` : undefined} sub="leads captured this year" icon={<Calendar className="w-full h-full" />} isDarkMode={isDarkMode} />
        <KpiCard label="Active Pipeline" value={totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : signals.length > 0 ? 'Pending' : '—'} delta={totalPipelineValue > 0 ? `${Object.keys(dossierCache).length} dossiers valued` : undefined} sub={totalPipelineValue === 0 && signals.length > 0 ? 'generate dossiers to see value' : undefined} icon={<DollarSign className="w-full h-full" />} isDarkMode={isDarkMode} />
        <KpiCard label="High-Intent Signals" value={highIntentCount.toString()} delta={highIntentCount > 0 ? 'Needs attention' : undefined} sub={`of ${signals.length} total signals`} icon={<Zap className="w-full h-full" />} isDarkMode={isDarkMode} />
        <KpiCard label="Unclaimed Leads" value={unclaimedCount.toString()} delta={unclaimedCount > 0 ? 'Requires Action' : unclaimedCount === 0 && signals.length > 0 ? 'All engaged ✓' : undefined} deltaUp={unclaimedCount === 0 && signals.length > 0 ? true : undefined} sub="status: New" icon={<AlertCircle className="w-full h-full" />} isDarkMode={isDarkMode} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] flex items-center justify-center" style={{ background: vl.primarySoft, color: vl.primary }}>
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Value of Opportunity by Sector</h3>
                <p className="text-xs" style={{ color: vl.textMuted }}>Pipeline value & signal count by matched industry</p>
              </div>
            </div>
          </div>

          {industryChartData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[280px] gap-3 rounded-[6px] border border-dashed" style={{ borderColor: vl.borderStrong }}>
              <BarChart2 className="w-8 h-8" style={{ color: vl.textMuted }} />
              <p className="text-xs font-medium" style={{ color: vl.textBody }}>No signals yet — run a Live Hunt to populate this chart</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={vl.borderStrong} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke={vl.textBody} fontSize={11} width={130} tickLine={false} axisLine={false} />
                  <Tooltip content={(props) => <CustomBarTooltip {...props} isDarkMode={isDarkMode} />} />
                  <Bar dataKey="Signals" radius={[0, 4, 4, 0]} maxBarSize={14}>
                    {industryChartData.map((_, i) => (
                      <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} fillOpacity={0.5} />
                    ))}
                  </Bar>
                  <Bar dataKey="Value" radius={[0, 4, 4, 0]} maxBarSize={14}>
                    {industryChartData.map((_, i) => (
                      <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 p-6 rounded-[6px] border vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-[4px] bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>By Location</h3>
              <p className="text-xs" style={{ color: vl.textMuted }}>Signal density by territory</p>
            </div>
          </div>
          {locationChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[240px] gap-3 rounded-[6px] border border-dashed" style={{ borderColor: vl.borderStrong }}>
              <MapPin className="w-8 h-8" style={{ color: vl.textMuted }} />
              <p className="text-xs font-medium" style={{ color: vl.textBody }}>No location data yet</p>
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={locationChartData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {locationChartData.map((_, i) => (
                        <Cell key={i} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: vl.surface, borderColor: vl.border, borderRadius: '6px', fontSize: '12px', color: vl.textMain, boxShadow: vl.shadow }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {locationChartData.map((item, i) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 truncate" style={{ color: vl.textBody }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LOCATION_COLORS[i % LOCATION_COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold ml-2 flex-shrink-0" style={{ color: vl.textMain }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Opportunity List ── */}
      <div className="rounded-[6px] border overflow-hidden vl-card" style={{ background: vl.surfaceMuted, borderColor: vl.border }}>
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 border-b" style={{ borderColor: vl.borderStrong, background: vl.surface }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-[4px] flex items-center justify-center" style={{ background: vl.primarySoft, color: vl.primary }}>
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>All Opportunities</h3>
              <p className="text-xs" style={{ color: vl.textMuted }}>{signals.length} signal{signals.length !== 1 ? 's' : ''} — click any row to open the full dossier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search opportunities…"
              value={opportunitySearch}
              onChange={e => setOpportunitySearch(e.target.value)}
              className="px-3 py-2 rounded-[4px] text-xs font-medium border outline-none transition-all w-48"
              style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}
            />
            <select
              value={opportunitySort}
              onChange={e => setOpportunitySort(e.target.value as any)}
              className="px-3 py-2 rounded-[4px] text-xs font-bold border outline-none cursor-pointer transition-all"
              style={{ background: vl.surface, color: vl.textMain, borderColor: vl.borderStrong }}
            >
              <option value="score">Sort: Score</option>
              <option value="value">Sort: Value</option>
              <option value="date">Sort: Date</option>
            </select>
          </div>
        </div>

        {signals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Target className="w-10 h-10" style={{ color: vl.textMuted }} />
            <p className="text-[13px] font-medium" style={{ color: vl.textBody }}>No opportunities yet — run a Live Hunt to discover signals</p>
          </div>
        )}

        {sortedOpportunities.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[700px] border-collapse bg-transparent">
              <thead>
                <tr className="label-caps border-b" style={{ color: vl.textBody, borderColor: vl.borderStrong }}>
                  <th className="px-5 py-3 font-bold">Account</th>
                  <th className="px-5 py-3 font-bold">Signal</th>
                  <th className="px-5 py-3 font-bold text-right">Est. Value</th>
                  <th className="px-5 py-3 font-bold text-center">Status</th>
                  <th className="px-5 py-3 font-bold text-center">Score</th>
                  <th className="px-5 py-3 font-bold text-center">Urgency</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: vl.borderStrong }}>
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
                      className="group cursor-pointer transition-all animate-in fade-in duration-300 hover-row"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[4px] flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: vl.primarySoft, color: vl.primary }}>
                            {accountName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[13px] truncate max-w-[150px]" style={{ color: vl.textMain }}>{accountName}</div>
                            {signal.region && <div className="text-[11px] truncate max-w-[150px]" style={{ color: vl.textMuted }}>{signal.region}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-[13px] leading-snug line-clamp-2" style={{ color: vl.textBody }}>{signal.headline}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {estValue > 0 ? (
                          <span className="font-mono font-bold text-sm" style={{ color: vl.primary }}>{formatCurrency(estValue)}</span>
                        ) : hasDossier ? (
                          <span className="text-xs" style={{ color: vl.textMuted }}>—</span>
                        ) : (
                          <span className="label-caps px-2 py-0.5 rounded-[4px] border" style={{ background: vl.chipBg, color: vl.textMuted, borderColor: vl.borderStrong }}>Generate</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border label-caps ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-6 h-6 rounded-[4px] flex items-center justify-center text-[10px] font-bold border ${
                            signal.score >= 80 ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : signal.score >= 60 ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                          }`}>
                            {signal.score}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold" style={{ color: vl.textMuted }}>
                          <span className={`w-2 h-2 rounded-full ${urgencyDot}`} />
                          {signal.urgency}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: vl.primary }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {signals.length > 0 && sortedOpportunities.length === 0 && (
          <div className="py-12 text-center" style={{ color: vl.textMuted }}>
            <p className="text-[13px]">No opportunities match "<strong>{opportunitySearch}</strong>"</p>
          </div>
        )}
      </div>

      {/* ── Industry Trends ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] flex items-center justify-center" style={{ background: vl.primarySoft, color: vl.primary }}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Latest Industry Trends</h2>
              <p className="text-[13px]" style={{ color: vl.textMuted }}>How market shifts are shaping opportunities for {profile.name}</p>
            </div>
          </div>
          <button onClick={() => fetchTrends(true)} disabled={isFetchingTrends} className="flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-bold border transition-all disabled:opacity-50" style={{ background: vl.surface, borderColor: vl.borderStrong, color: vl.textMain }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTrends ? 'animate-spin' : ''}`} />
            {isFetchingTrends ? 'Fetching…' : 'Refresh'}
          </button>
        </div>

        {isFetchingTrends && (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 rounded-[6px] border animate-pulse vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                <div className="w-24 h-3 rounded-[4px] mb-3" style={{ background: vl.chipBg }} />
                <div className="w-3/4 h-5 rounded-[4px] mb-2" style={{ background: vl.chipBg }} />
                <div className="w-full h-4 rounded-[4px] mb-1.5" style={{ background: vl.chipBg }} />
                <div className="w-2/3 h-4 rounded-[4px]" style={{ background: vl.chipBg }} />
              </div>
            ))}
          </div>
        )}

        {!isFetchingTrends && trendsError && (
          <div className="p-6 rounded-[6px] border text-center" style={{ background: '#EF444415', borderColor: '#EF444430' }}>
            <AlertCircle className="w-6 h-6 text-[#EF4444] mx-auto mb-2" />
            <p className="text-[13px]" style={{ color: vl.textMuted }}>{trendsError}</p>
          </div>
        )}

        {!isFetchingTrends && trends.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {trends.map((trend, i) => (
              <div key={i} className="p-6 rounded-[6px] border group transition-all vl-card" style={{ animationDelay: `${i * 100}ms`, background: vl.surface, borderColor: vl.border }}>
                <div className="flex items-start justify-between gap-3 mb-4 border-b pb-4" style={{ borderColor: vl.borderStrong }}>
                  <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0 ${trend.marketShift === 'bullish' ? 'bg-[#10B981]/10 text-[#10B981]' : trend.marketShift === 'bearish' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {trend.marketShift === 'bullish' ? <TrendingUp className="w-4 h-4" /> : trend.marketShift === 'bearish' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </div>
                  <TrendShiftBadge shift={trend.marketShift} />
                </div>
                <h4 className="font-semibold text-sm leading-snug mb-3" style={{ color: vl.textMain }}>{trend.title}</h4>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: vl.textBody }}>{trend.impact}</p>
                <div className="p-3.5 rounded-[4px] border text-xs leading-relaxed" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)', color: vl.textMain }}>
                  <span className="font-bold" style={{ color: vl.primary }}>For {profile.name}: </span>{trend.relevance}
                </div>
                {trend.sourceUrl && (
                  <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-4 text-[10px] font-bold hover:underline" style={{ color: vl.primary }}>
                    <ExternalLink className="w-3 h-3" /> {trend.sourceTitle || 'Source'}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!isFetchingTrends && !trendsError && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-[6px] border border-dashed" style={{ borderColor: vl.borderStrong }}>
            <Radar className="w-10 h-10" style={{ color: vl.textMuted }} />
            <p className="text-[13px] font-medium" style={{ color: vl.textBody }}>Click <strong>Refresh</strong> to load current industry trends for {profile.industry}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default InsightsView;
