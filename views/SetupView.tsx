
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Building2,
  Target,
  Activity,
  Box,
  Globe,
  RefreshCw,
  Monitor,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SalesTrigger, BusinessProfile, MarketSignal, TrackedWebsite } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { CustomTriggerModal } from '../components/CustomTriggerModal';
import { TrackWebsiteModal } from '../components/TrackWebsiteModal';
import { getVL } from '../utils/vesper';

interface SetupViewProps {
  profile: BusinessProfile | null;
  triggers: SalesTrigger[];
  trackedWebsites?: TrackedWebsite[];
  setTriggers: React.Dispatch<React.SetStateAction<SalesTrigger[]>>;
  signals: MarketSignal[];
  onGenerateSignals: () => void;
  isGenerating: boolean;
  onDeleteTrigger?: (triggerId: string) => Promise<boolean>;
  onActivateTrigger?: (triggerId: string) => Promise<boolean>;
  onAddTrackedWebsite?: (website: { url: string; purpose?: string; target_keywords?: string }) => Promise<TrackedWebsite | null>;
  onRemoveTrackedWebsite?: (id: string) => Promise<boolean>;
  onScanWebsite?: (site: TrackedWebsite) => Promise<void>;
  marketActivity?: { level: string, summary: string, colorClass: string } | null;
  isAssessing?: boolean;
  onGenerateAITriggers?: () => void;
  isGeneratingAITriggers?: boolean;
}

type TabType = 'active' | 'ai_generated' | 'tracked_sites';

const SetupView: React.FC<SetupViewProps> = ({
  profile,
  triggers,
  trackedWebsites = [],
  setTriggers,
  signals,
  onGenerateSignals,
  isGenerating,
  onDeleteTrigger,
  onActivateTrigger,
  onAddTrackedWebsite,
  onRemoveTrackedWebsite,
  onScanWebsite,
  marketActivity,
  isAssessing,
  onGenerateAITriggers,
  isGeneratingAITriggers,
}) => {
  const { isDarkMode } = useTheme();
  const vl = getVL(isDarkMode);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showCustomTriggerModal, setShowCustomTriggerModal] = useState(false);
  const [showTrackWebsiteModal, setShowTrackWebsiteModal] = useState(false);
  const [scanningSiteId, setScanningSiteId] = useState<string | null>(null);

  // Filter triggers by tab
  const activeTriggers = triggers.filter(t => !t.triggerType || t.triggerType === 'active');
  const aiGeneratedTriggers = triggers.filter(t => t.triggerType === 'ai_generated');
  const displayTriggers = activeTab === 'active' ? activeTriggers : aiGeneratedTriggers;

  const handleDelete = async (id: string) => {
    if (onDeleteTrigger) {
      await onDeleteTrigger(id);
    } else {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleActivate = async (id: string) => {
    if (onActivateTrigger) {
      await onActivateTrigger(id);
    }
  };

  // Metric Data
  const metrics = [
    {
      label: 'Base Profile',
      value: profile?.name || 'Not Set',
      icon: Building2,
    },
    {
      label: 'Active Products',
      value: `${profile?.products?.length || 0} Active SKUs`,
      icon: Box,
    },
    {
      label: 'Targeting',
      value: `${profile?.targetGroups?.length || 0} Priority Segments`,
      icon: Target,
    },
    {
      label: 'Activity Level',
      value: isAssessing ? 'Polling Trend...' : (marketActivity?.level || 'Assessing...'),
      icon: isAssessing ? RefreshCw : (marketActivity ? Activity : TrendingUp),
      valueColor: isAssessing ? vl.textMuted : vl.primary,
      summary: marketActivity?.summary,
      isSpinning: isAssessing,
    },
  ];

  // ── Tab button styles ──────────────────────────────────────────────────────
  const tabStyle = (tab: TabType) => ({
    fontSize: '13px',
    fontWeight: activeTab === tab ? 600 : 500,
    color: activeTab === tab ? vl.primary : vl.textMuted,
    borderBottom: activeTab === tab ? `2px solid ${vl.primary}` : '2px solid transparent',
    paddingBottom: '10px',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'none',
    cursor: 'pointer',
  } as React.CSSProperties);

  const badgeStyle = (tab: TabType, color: 'indigo' | 'purple' | 'emerald') => {
    const isActive = activeTab === tab;
    const colors = {
      indigo: { bg: isActive ? (isDarkMode ? 'rgba(99,91,255,0.18)' : '#EEF2FF') : vl.chipBg, text: isActive ? vl.primary : vl.textMuted },
      purple: { bg: isActive ? (isDarkMode ? 'rgba(139,92,246,0.18)' : '#F3F4FF') : vl.chipBg, text: isActive ? '#8B5CF6' : vl.textMuted },
      emerald: { bg: isActive ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5') : vl.chipBg, text: isActive ? '#10B981' : vl.textMuted },
    };
    return {
      marginLeft: '6px',
      padding: '1px 6px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontWeight: 700,
      background: colors[color].bg,
      color: colors[color].text,
    } as React.CSSProperties;
  };

  // ── Status badge ────────────────────────────────────────────────────────────
  const StatusBadge = ({ type }: { type: 'active' | 'ai' | 'verified' }) => {
    const configs = {
      active: { label: 'Active', bg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5', color: '#10B981', border: isDarkMode ? 'rgba(16,185,129,0.25)' : '#A7F3D0' },
      ai: { label: 'Leadpulse Suggested', bg: isDarkMode ? 'rgba(139,92,246,0.12)' : '#F3F4FF', color: '#8B5CF6', border: isDarkMode ? 'rgba(139,92,246,0.22)' : '#DDD6FE' },
      verified: { label: 'Verified', bg: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ECFDF5', color: '#10B981', border: isDarkMode ? 'rgba(16,185,129,0.22)' : '#A7F3D0' },
    };
    const c = configs[type];
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        display: 'inline-block',
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '96px' }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: vl.textMain,
            margin: 0,
            lineHeight: 1.2,
          }}>
            Signal Engine Setup
          </h1>
          <p style={{
            fontSize: '14px',
            color: vl.textBody,
            marginTop: '6px',
            lineHeight: '20px',
          }}>
            Configure and refine automated market intelligence triggers.
          </p>
        </div>

        <button
          onClick={() => setShowTrackWebsiteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: vl.primary,
            color: '#fff',
            border: 'none',
            boxShadow: '0 1px 4px rgba(99,91,255,0.3)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = vl.primaryHover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = vl.primary; }}
        >
          <Globe style={{ width: '14px', height: '14px' }} />
          Track Website
        </button>
      </header>

      {/* ── Metrics Row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        background: vl.surface,
        border: `1px solid ${vl.border}`,
        borderRadius: '6px',
        boxShadow: vl.shadow,
        marginBottom: '24px',
        overflow: 'hidden',
      }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            className="relative group"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              borderRight: i < metrics.length - 1 ? `1px solid ${vl.border}` : 'none',
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: vl.primarySoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <m.icon
                style={{
                  width: '16px',
                  height: '16px',
                  color: vl.primary,
                }}
                className={m.isSpinning ? 'animate-spin' : ''}
              />
            </div>
            <div>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: vl.textMuted,
                margin: '0 0 3px 0',
                lineHeight: 1,
              }}>
                {m.label}
              </p>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: m.valueColor || vl.textMain,
                margin: 0,
                lineHeight: '20px',
              }}>
                {m.value}
              </p>
            </div>

            {/* Tooltip */}
            {m.summary && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 w-56 p-3 text-xs rounded-[6px] shadow-lg leading-relaxed text-center"
                style={{
                  background: isDarkMode ? '#1E293B' : '#191C1E',
                  color: '#F8FAFC',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                }}
              >
                {m.summary}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Table Section ───────────────────────────────────────────────── */}
      <section>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          {/* Left: Title + Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: vl.textMain,
              margin: 0,
            }}>
              Active Configurations
            </h2>

            {activeTab === 'ai_generated' && onGenerateAITriggers && (
              <button
                onClick={onGenerateAITriggers}
                disabled={isGeneratingAITriggers}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isGeneratingAITriggers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  background: isDarkMode ? 'rgba(99,91,255,0.12)' : '#F0F1FF',
                  color: vl.primary,
                  border: `1px solid ${isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.2)'}`,
                  opacity: isGeneratingAITriggers ? 0.6 : 1,
                }}
              >
                {isGeneratingAITriggers ? <RefreshCw style={{ width: '12px', height: '12px' }} className="animate-spin" /> : <Sparkles style={{ width: '12px', height: '12px' }} />}
                {isGeneratingAITriggers ? 'Generating...' : 'Auto-Generate'}
              </button>
            )}

            <button
              onClick={() => setShowCustomTriggerModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: vl.surface,
                color: vl.textBody,
                border: `1px solid ${vl.borderStrong}`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = vl.primary;
                (e.currentTarget as HTMLButtonElement).style.color = vl.primary;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = vl.borderStrong;
                (e.currentTarget as HTMLButtonElement).style.color = vl.textBody;
              }}
            >
              <Plus style={{ width: '12px', height: '12px' }} />
              Create Trigger
            </button>
          </div>

          {/* Right: Tabs */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('active')}
              style={tabStyle('active')}
              id="tab-active-triggers"
            >
              Active Triggers
              {activeTriggers.length > 0 && (
                <span style={badgeStyle('active', 'indigo')}>{activeTriggers.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai_generated')}
              style={tabStyle('ai_generated')}
              id="tab-ai-triggers"
            >
              <Sparkles style={{ width: '11px', height: '11px' }} />
              Leadpulse Generated
              {aiGeneratedTriggers.length > 0 && (
                <span style={badgeStyle('ai_generated', 'purple')}>{aiGeneratedTriggers.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tracked_sites')}
              style={tabStyle('tracked_sites')}
              id="tab-tracked-sites"
            >
              <Globe style={{ width: '11px', height: '11px' }} />
              Tracked Sites
              {trackedWebsites.length > 0 && (
                <span style={badgeStyle('tracked_sites', 'emerald')}>{trackedWebsites.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Table Container ──────────────────────────────────────────────── */}
        <div style={{
          background: vl.surface,
          border: `1px solid ${vl.border}`,
          borderRadius: '6px',
          boxShadow: vl.shadow,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              {activeTab === 'tracked_sites' ? (
                <tr style={{ background: vl.tableHeader, borderBottom: `1px solid ${vl.border}` }}>
                  {['Website URL', 'Tracking Purpose & Keywords', 'Status', 'Last Scanned', ''].map((header, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 20px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: vl.textMuted,
                        width: i === 4 ? '100px' : 'auto',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              ) : (
                <tr style={{ background: vl.tableHeader, borderBottom: `1px solid ${vl.border}` }}>
                  {['Trigger Event', 'Logic & Intent', 'Status', 'Category', ''].map((header, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 20px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: vl.textMuted,
                        width: i === 4 ? '120px' : 'auto',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody>
              {activeTab === 'tracked_sites' ? (
                trackedWebsites.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{
                        padding: '48px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <Globe style={{ width: '28px', height: '28px', color: vl.textMuted }} />
                        <p style={{ fontSize: '14px', color: vl.textBody, margin: 0 }}>
                          No websites are currently being tracked.
                        </p>
                        <button
                          onClick={() => setShowTrackWebsiteModal(true)}
                          style={{
                            marginTop: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: vl.primary,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          + Track a Website
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trackedWebsites.map((site) => (
                    <tr
                      key={site.id}
                      style={{ borderBottom: `1px solid ${vl.border}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = vl.rowHover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: vl.textMain, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {site.url}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        {site.purpose && (
                          <p style={{ fontSize: '13px', fontWeight: 500, color: vl.textBody, margin: '0 0 4px 0' }}>{site.purpose}</p>
                        )}
                        <p style={{ fontSize: '12px', color: vl.textMuted, margin: 0, fontStyle: 'italic' }}>
                          "{site.targetKeywords || 'Any interesting signals'}"
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <StatusBadge type="active" />
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: vl.textMuted,
                          background: vl.chipBg,
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          <Monitor style={{ width: '11px', height: '11px' }} />
                          {site.lastScannedAt ? new Date(site.lastScannedAt).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={async () => {
                              if (onScanWebsite) {
                                setScanningSiteId(site.id);
                                await onScanWebsite(site);
                                setScanningSiteId(null);
                              }
                            }}
                            disabled={scanningSiteId !== null}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: scanningSiteId !== null ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                              background: scanningSiteId === site.id ? vl.primarySoft : vl.primary,
                              color: scanningSiteId === site.id ? vl.primary : '#fff',
                              border: 'none',
                            }}
                          >
                            {scanningSiteId === site.id ? (
                              <><RefreshCw style={{ width: '11px', height: '11px' }} className="animate-spin" /> Scanning...</>
                            ) : (
                              <><Zap style={{ width: '11px', height: '11px' }} /> Scan Now</>
                            )}
                          </button>
                          <button
                            onClick={() => onRemoveTrackedWebsite && onRemoveTrackedWebsite(site.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              border: 'none',
                              background: 'transparent',
                              color: vl.textMuted,
                              cursor: 'pointer',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = vl.textMuted}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : displayTriggers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{
                      padding: '48px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      {activeTab === 'ai_generated' ? (
                        <>
                          <Sparkles style={{ width: '28px', height: '28px', color: vl.textMuted }} />
                          <p style={{ fontSize: '14px', color: vl.textBody, margin: 0 }}>
                            No Leadpulse-generated triggers yet.
                          </p>
                          <p style={{ fontSize: '13px', color: vl.textMuted, textAlign: 'center', maxWidth: '320px', margin: 0, lineHeight: '18px' }}>
                            Use the <strong>Auto-Generate</strong> button to let Leadpulse propose intelligent signals based on your business profile.
                          </p>
                          {onGenerateAITriggers && (
                            <button
                              onClick={onGenerateAITriggers}
                              disabled={isGeneratingAITriggers}
                              style={{
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: isGeneratingAITriggers ? 'not-allowed' : 'pointer',
                                background: vl.primarySoft,
                                color: vl.primary,
                                border: `1px solid rgba(99,91,255,0.2)`,
                              }}
                            >
                              {isGeneratingAITriggers ? <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Sparkles style={{ width: '13px', height: '13px' }} />}
                              {isGeneratingAITriggers ? 'Generating Triggers...' : 'Generate AI Triggers'}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Target style={{ width: '28px', height: '28px', color: vl.textMuted }} />
                          <p style={{ fontSize: '14px', color: vl.textBody, margin: 0 }}>
                            No active triggers configured.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayTriggers.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: `1px solid ${vl.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = vl.rowHover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: vl.textMain, margin: '0 0 3px 0', lineHeight: '20px' }}>
                        {t.event}
                      </p>
                      <p style={{ fontSize: '12px', color: vl.textMuted, margin: 0 }}>{t.source}</p>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <p style={{ fontSize: '13px', color: vl.textBody, margin: 0, fontStyle: 'italic', lineHeight: '18px', maxWidth: '280px' }}>
                        "{t.logic}"
                      </p>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <StatusBadge type={t.triggerType === 'ai_generated' ? 'ai' : 'verified'} />
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      {t.scope === 'global' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: vl.textMuted,
                          background: vl.chipBg,
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          <Globe style={{ width: '11px', height: '11px' }} /> All Products
                        </span>
                      ) : t.scope === 'bundle' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#8B5CF6',
                          background: isDarkMode ? 'rgba(139,92,246,0.10)' : '#F3F4FF',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}>
                          <RefreshCw style={{ width: '11px', height: '11px' }} /> {t.bundleName}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '12px',
                          color: vl.textMuted,
                          background: vl.chipBg,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}>
                          {t.product}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {t.triggerType === 'ai_generated' && onActivateTrigger && (
                          <button
                            onClick={() => handleActivate(t.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: vl.primary,
                              color: '#fff',
                              border: 'none',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = vl.primaryHover}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = vl.primary}
                          >
                            <ArrowRight style={{ width: '11px', height: '11px' }} />
                            Activate
                          </button>
                        )}
                        {activeTab === 'active' && (
                          <button
                            style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: 'transparent',
                              color: vl.textBody,
                              border: `1px solid ${vl.borderStrong}`,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = vl.primary;
                              (e.currentTarget as HTMLButtonElement).style.color = vl.primary;
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = vl.borderStrong;
                              (e.currentTarget as HTMLButtonElement).style.color = vl.textBody;
                            }}
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: vl.textMuted,
                            cursor: 'pointer',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = vl.textMuted}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Floating Bottom Bar ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
        <div
          className="backdrop-blur-md flex items-center gap-5"
          style={{
            background: isDarkMode ? 'rgba(15,15,15,0.85)' : 'rgba(255,255,255,0.92)',
            border: `1px solid ${vl.borderStrong}`,
            borderRadius: '9999px',
            padding: '10px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
            }} className="animate-pulse" />
            <p style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: vl.textBody,
              margin: 0,
            }}>
              {activeTriggers.length} Active Trigger{activeTriggers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ width: '1px', height: '20px', background: vl.border }} />

          <button
            onClick={onGenerateSignals}
            disabled={isGenerating || activeTriggers.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isGenerating || activeTriggers.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background: isGenerating || activeTriggers.length === 0
                ? (isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FB')
                : vl.primary,
              color: isGenerating || activeTriggers.length === 0 ? vl.textMuted : '#fff',
              border: `1px solid ${isGenerating || activeTriggers.length === 0 ? vl.border : 'transparent'}`,
              boxShadow: isGenerating || activeTriggers.length === 0 ? 'none' : '0 2px 8px rgba(99,91,255,0.35)',
            }}
          >
            {isGenerating ? (
              <><RefreshCw style={{ width: '14px', height: '14px' }} className="animate-spin" /> Initializing Hunt...</>
            ) : (
              <><Zap style={{ width: '14px', height: '14px' }} fill="currentColor" /> Trigger Live Hunt</>
            )}
          </button>
        </div>
      </div>

      {/* Custom Trigger Modal */}
      {showCustomTriggerModal && (
        <CustomTriggerModal
          onClose={() => setShowCustomTriggerModal(false)}
          onAdd={(newTrigger) => {
            setTriggers(prev => [...prev, newTrigger]);
            setActiveTab('active');
          }}
        />
      )}

      {/* Track Website Modal */}
      {showTrackWebsiteModal && (
        <TrackWebsiteModal
          onClose={() => setShowTrackWebsiteModal(false)}
          onAdd={async (newSite) => {
            if (onAddTrackedWebsite) {
              await onAddTrackedWebsite(newSite);
            }
            setActiveTab('tracked_sites');
          }}
        />
      )}
    </div>
  );
};

export default SetupView;
