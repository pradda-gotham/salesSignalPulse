
import React from 'react';
import {
  Activity,
  Target,
  Zap,
  BarChart3,
  Settings,
  Search,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogoClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogoClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'strategy', label: 'Strategy', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode
        ? 'bg-[#0a0a0a] text-[#ededed]'
        : 'bg-gray-50 text-gray-900'
      }`}>
      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 border-r flex flex-col transition-colors duration-300 ${isDarkMode
          ? 'border-white/5 bg-[#0f0f0f]'
          : 'border-gray-200 bg-white'
        }`}>
        <div className="p-6">
          {/* Logo / Home Redirect */}
          <div
            onClick={() => onLogoClick ? onLogoClick() : onTabChange('signals')}
            className="flex items-center gap-2 mb-8 cursor-pointer group hover:opacity-80 transition-opacity"
            role="button"
            aria-label="Go to Home"
          >
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SalesPulse</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                    ? isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-orange-50 text-orange-600'
                    : isDarkMode
                      ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id
                    ? 'text-orange-400'
                    : isDarkMode
                      ? 'group-hover:text-zinc-400'
                      : 'group-hover:text-gray-600'
                  }`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className={`p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode
              ? 'bg-gradient-to-br from-orange-600/10 to-red-600/10 border-orange-500/20'
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
            }`}>
            <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider">Plan: Enterprise</p>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Titan Heavy Rentals</p>
          </div>
        </div>
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
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-orange-400' : 'text-gray-400 group-focus-within:text-orange-500'
                }`} />
              <input
                type="text"
                placeholder="Search signals..."
                className={`border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 w-64 transition-all ${isDarkMode
                    ? 'bg-white/5 border-white/5'
                    : 'bg-gray-100 border-gray-200'
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
