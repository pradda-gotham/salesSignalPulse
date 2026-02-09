
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
  Radar,
  PanelLeftClose,
  PanelLeft
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
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'live-hunt', label: 'Live Hunt', icon: Radar },
    { id: 'strategy', label: 'Strategy', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode
      ? 'bg-[#0a0a0a] text-[#ededed]'
      : 'bg-[#F7F7F9] text-[#1B1D21]'
      }`}>
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Sidebar Content */}
        <div className={`flex-1 border-r flex flex-col transition-colors duration-300 ${isDarkMode
          ? 'border-white/5 bg-[#0f0f0f]'
          : 'border-gray-200 bg-white'
          }`}>
          <div className={`p-6 ${isCollapsed ? 'px-4' : ''}`}>
            {/* Logo */}
            <div
              onClick={() => onLogoClick ? onLogoClick() : onTabChange('signals')}
              className={`flex items-center gap-2.5 mb-8 cursor-pointer group hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center' : ''}`}
              role="button"
              aria-label="Go to Home"
            >
              <div className="w-9 h-9 bg-[#6C5DD3] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">SalesPulse</span>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center px-3' : ''
                    } ${activeTab === item.id
                      ? isDarkMode
                        ? 'bg-[#6C5DD3]/15 text-white'
                        : 'bg-[#6C5DD3]/10 text-[#6C5DD3]'
                      : isDarkMode
                        ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        : 'text-[#808191] hover:text-[#1B1D21] hover:bg-gray-100'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id
                    ? 'text-[#6C5DD3]'
                    : isDarkMode
                      ? 'group-hover:text-zinc-400'
                      : 'group-hover:text-[#6C5DD3]'
                    }`} />
                  {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className={`absolute left-full ml-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-gray-900 text-white'
                      }`}>
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Plan Info */}
          <div className={`mt-auto p-6 ${isCollapsed ? 'px-4' : ''}`}>
            <div className={`p-4 rounded-2xl transition-colors duration-300 ${isCollapsed ? 'p-3' : ''
              } ${isDarkMode
                ? 'bg-gradient-to-br from-[#6C5DD3]/10 to-[#00C4FF]/10 border border-[#6C5DD3]/20'
                : 'bg-gradient-to-br from-[#6C5DD3]/5 to-[#00C4FF]/5'
              }`}>
              {isCollapsed ? (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-[#6C5DD3]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#6C5DD3]">E</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#6C5DD3] font-semibold mb-1 uppercase tracking-wider">Plan: Enterprise</p>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-[#808191]'}`}>{organizationName || 'No Organization'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edge Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 rounded-full flex items-center justify-center transition-all duration-200 z-20 shadow-lg ${isDarkMode
            ? 'bg-[#1a1a1a] border border-white/10 hover:bg-[#252525] text-zinc-400 hover:text-white'
            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700'
            }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300 ${isDarkMode
          ? 'border-white/5 bg-[#0a0a0a]/50'
          : 'border-gray-200 bg-white/80'
          }`}>
          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            <span className="text-sm">Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className={`text-sm font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-[#6C5DD3]' : 'text-[#808191] group-focus-within:text-[#6C5DD3]'
                }`} />
              <input
                type="text"
                placeholder="Search signals..."
                className={`border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#6C5DD3]/50 focus:ring-1 focus:ring-[#6C5DD3]/50 w-64 transition-all ${isDarkMode
                  ? 'bg-white/5 border-white/5'
                  : 'bg-gray-100 border-transparent'
                  }`}
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all hover:scale-110 ${isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${isDarkMode
              ? 'bg-zinc-800 border-white/10 text-zinc-300'
              : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}>
              JD
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
