
import React, { useState } from 'react';
import {
  Activity,
  Target,
  Zap,
  BarChart3,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Package,
  UserCircle2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogoClick?: () => void;
  organizationName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogoClick, organizationName }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'profile', label: 'Profile', icon: UserCircle2 },
    { id: 'setup', label: 'Setup', icon: Activity },
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ];

  // ─── Vesper Logic color tokens ───────────────────────────────────────────────
  const vl = {
    sidebar: isDarkMode ? '#0f0f0f' : '#F8F9FB',
    sidebarBorder: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F3F5',
    surface: isDarkMode ? '#141414' : '#FFFFFF',
    canvas: isDarkMode ? '#0a0a0a' : '#F8F9FB',
    primary: '#635BFF',
    primaryHover: '#4F46E5',
    primarySoft: isDarkMode ? 'rgba(99,91,255,0.12)' : '#F0F1FF',
    border: isDarkMode ? 'rgba(255,255,255,0.07)' : '#F1F3F5',
    borderStrong: isDarkMode ? 'rgba(255,255,255,0.10)' : '#E2E8F0',
    textMain: isDarkMode ? '#EDEDED' : '#191C1E',
    textBody: isDarkMode ? '#94A3B8' : '#4A5568',
    textMuted: isDarkMode ? '#64748B' : '#94A3B8',
    header: isDarkMode ? 'rgba(10,10,10,0.80)' : 'rgba(255,255,255,0.90)',
    headerBorder: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F3F5',
  };

  return (
    <div
      style={{ fontFamily: "'Manrope', sans-serif" }}
      className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0a0a0a] text-[#ededed]' : 'bg-[#F8F9FB] text-[#191C1E]'
      }`}
    >
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 flex transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Sidebar Content */}
        <div
          className="flex-1 flex flex-col border-r transition-colors duration-300"
          style={{
            background: vl.sidebar,
            borderColor: vl.sidebarBorder,
          }}
        >
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <div
            className={`flex-shrink-0 ${isCollapsed ? 'px-4 py-6' : 'px-6 py-6'}`}
            style={{ borderBottom: `1px solid ${vl.sidebarBorder}` }}
          >
            <div
              onClick={() => (onLogoClick ? onLogoClick() : onTabChange('signals'))}
              className={`flex items-center gap-3 cursor-pointer group select-none ${
                isCollapsed ? 'justify-center' : ''
              }`}
              role="button"
              aria-label="Go to Home"
            >
              {/* Icon mark */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-[6px] flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  background: vl.primary,
                  boxShadow: `0 2px 8px rgba(99,91,255,0.35)`,
                }}
              >
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>

              {!isCollapsed && (
                <span
                  className="text-[20px] font-semibold tracking-tight whitespace-nowrap overflow-hidden leading-none"
                  style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    letterSpacing: '-0.01em',
                    color: vl.textMain,
                  }}
                >
                  Leadpulse
                </span>
              )}
            </div>
          </div>

          {/* ── Nav Items ─────────────────────────────────────────────────── */}
          <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-3' : 'px-4'} space-y-0.5`}>
            {/* Section label */}
            {!isCollapsed && (
              <p
                className="mb-2 px-2"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: vl.textMuted,
                }}
              >
                Navigation
              </p>
            )}

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center transition-all duration-150 rounded-[6px] group relative ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
                  }`}
                  style={{
                    background: isActive ? vl.primarySoft : 'transparent',
                    color: isActive
                      ? vl.primary
                      : isDarkMode
                      ? '#64748B'
                      : '#4A5568',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = isDarkMode
                        ? 'rgba(255,255,255,0.04)'
                        : '#F1F3F5';
                      (e.currentTarget as HTMLButtonElement).style.color = vl.textMain;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = isDarkMode
                        ? '#64748B'
                        : '#4A5568';
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && !isCollapsed && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                      style={{ background: vl.primary }}
                    />
                  )}

                  <item.icon
                    className="flex-shrink-0 transition-colors"
                    style={{
                      width: '16px',
                      height: '16px',
                      color: isActive ? vl.primary : 'currentColor',
                    }}
                  />

                  {!isCollapsed && (
                    <span
                      className="whitespace-nowrap overflow-hidden"
                      style={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        lineHeight: '20px',
                      }}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div
                      className="absolute left-full ml-3 px-3 py-1.5 rounded-[6px] text-[13px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"
                      style={{
                        background: isDarkMode ? '#1E293B' : '#191C1E',
                        color: '#fff',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Bottom Plan Card ──────────────────────────────────────────── */}
          <div
            className={`flex-shrink-0 ${isCollapsed ? 'px-3 py-4' : 'px-4 py-4'}`}
            style={{ borderTop: `1px solid ${vl.sidebarBorder}` }}
          >
            <button
              onClick={() => onTabChange('settings')}
              className="w-full text-left transition-all duration-200 rounded-[6px] cursor-pointer"
              style={{
                padding: isCollapsed ? '10px' : '12px',
                background: isDarkMode ? 'rgba(99,91,255,0.08)' : '#F0F1FF',
                border: `1px solid ${isDarkMode ? 'rgba(99,91,255,0.18)' : 'rgba(99,91,255,0.15)'}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode
                  ? 'rgba(99,91,255,0.14)'
                  : '#E8E6FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode
                  ? 'rgba(99,91,255,0.08)'
                  : '#F0F1FF';
              }}
            >
              {isCollapsed ? (
                <div className="flex items-center justify-center">
                  <div
                    className="w-7 h-7 rounded-[4px] flex items-center justify-center"
                    style={{ background: 'rgba(99,91,255,0.18)' }}
                  >
                    <span className="text-[11px] font-bold" style={{ color: vl.primary }}>
                      E
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: vl.primary,
                      marginBottom: '2px',
                    }}
                  >
                    Enterprise Plan
                  </p>
                  <p
                    className="truncate"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: vl.textBody,
                      lineHeight: '16px',
                    }}
                  >
                    {organizationName || 'No Organization'}
                  </p>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Collapse Toggle ───────────────────────────────────────────────── */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 z-20"
          style={{
            background: vl.surface,
            border: `1px solid ${vl.borderStrong}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            color: vl.textMuted,
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight style={{ width: '12px', height: '12px' }} />
          ) : (
            <ChevronLeft style={{ width: '12px', height: '12px' }} />
          )}
        </button>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-md"
          style={{
            height: '64px',
            background: vl.header,
            borderBottom: `1px solid ${vl.headerBorder}`,
          }}
        >
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1.5"
            style={{ color: vl.textMuted, fontSize: '14px' }}
          >
            <span>Workspace</span>
            <ChevronRight style={{ width: '14px', height: '14px' }} />
            <span
              className="capitalize font-semibold"
              style={{ color: vl.textMain }}
            >
              {activeTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{
                  width: '14px',
                  height: '14px',
                  color: vl.textMuted,
                }}
              />
              <input
                type="text"
                placeholder="Search signals..."
                className="transition-all focus:outline-none"
                style={{
                  width: '220px',
                  height: '36px',
                  paddingLeft: '36px',
                  paddingRight: '16px',
                  fontSize: '13px',
                  fontFamily: "'Manrope', sans-serif",
                  borderRadius: '6px',
                  border: `1px solid ${vl.borderStrong}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FB',
                  color: vl.textMain,
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = vl.primary;
                  (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px rgba(99,91,255,0.12)`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = vl.borderStrong;
                  (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center transition-all"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: `1px solid ${vl.borderStrong}`,
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FB',
                color: isDarkMode ? '#F59E0B' : '#4A5568',
              }}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun style={{ width: '16px', height: '16px' }} /> : <Moon style={{ width: '16px', height: '16px' }} />}
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
