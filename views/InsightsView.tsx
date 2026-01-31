
import React, { useState } from 'react';
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
  Pie
} from 'recharts';
import {
  TrendingUp,
  Mail,
  Download,
  Radar,
  Activity
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const MOCK_MOMENTUM = [
  { name: 'Mining', value: 850 },
  { name: 'Gov', value: 420 },
  { name: 'Civil', value: 680 },
  { name: 'Power', value: 120 },
];

const MOCK_INTENSITY = [
  { name: 'Western AU', value: 400 },
  { name: 'Northern Terr.', value: 300 },
  { name: 'Queensland', value: 200 },
  { name: 'Victoria', value: 100 },
];

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412'];

interface InsightsViewProps {
  profile: BusinessProfile;
}

const InsightsView: React.FC<InsightsViewProps> = ({ profile }) => {
  const { isDarkMode } = useTheme();
  const [showNewsletterConfig, setShowNewsletterConfig] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Market Intensity Map</h1>
          <p className={`text-lg font-medium italic tracking-tight ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Active signal clusters for {profile.name}</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${isDarkMode
              ? 'bg-[#141414] hover:bg-white/10 text-white border-white/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}>
            <Download className="w-4 h-4" /> Export Strategic Review
          </button>
          <button
            onClick={() => setShowNewsletterConfig(!showNewsletterConfig)}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-black transition-all shadow-xl shadow-orange-500/20"
          >
            <Mail className="w-4 h-4" /> Management Digest
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Active Pipeline', val: '1.2M', delta: '+15%', color: 'orange' },
          { label: 'Signal Accuracy', val: '89%', delta: 'Rep Verified', color: 'green' },
          { label: 'Avg Contact Lag', val: '1.4h', delta: '-22% Improved', color: 'green' },
          { label: 'Unclaimed Leads', val: '12', delta: 'Requires Action', color: 'red' },
        ].map((metric) => (
          <div key={metric.label} className={`p-8 rounded-[2rem] border transition-all shadow-lg group ${isDarkMode
              ? 'bg-[#141414] border-white/5 hover:border-orange-500/20'
              : 'bg-white border-gray-200 hover:border-orange-400/50'
            }`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-3 transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-orange-400' : 'text-gray-500 group-hover:text-orange-600'
              }`}>{metric.label}</div>
            <div className={`text-4xl font-black mb-2 tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metric.val}</div>
            <div className={`text-xs font-bold ${metric.color === 'green' ? 'text-green-500' :
                metric.color === 'red' ? 'text-red-500' : 'text-orange-500'
              }`}>
              {metric.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Momentum Chart */}
        <div className={`md:col-span-8 p-10 rounded-[2.5rem] border space-y-8 ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-black text-2xl flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className="w-6 h-6 text-orange-500" />
              Pulse by Industry Sector
            </h3>
            <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${isDarkMode ? 'text-zinc-500 bg-white/5' : 'text-gray-500 bg-gray-100'
              }`}>Intensity Score</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_MOMENTUM} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#222" : "#e5e7eb"} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke={isDarkMode ? "#555" : "#9ca3af"} fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    color: isDarkMode ? '#fff' : '#111827',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {MOCK_MOMENTUM.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : isDarkMode ? '#222' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Territory Mix */}
        <div className={`md:col-span-4 p-10 rounded-[2.5rem] border space-y-8 ${isDarkMode ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
          }`}>
          <h3 className={`font-black text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Territory Hot-Zones</h3>
          <div className="h-[240px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_INTENSITY}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {MOCK_INTENSITY.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{
                  backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  color: isDarkMode ? '#fff' : '#111827',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {MOCK_INTENSITY.map((item, i) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <span className={`flex items-center gap-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} /> {item.name}
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value} signals</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className={`p-10 rounded-[3rem] border relative overflow-hidden group ${isDarkMode
          ? 'bg-gradient-to-br from-orange-600/10 via-red-600/5 to-transparent border-orange-500/20'
          : 'bg-gradient-to-br from-orange-50 via-red-50 to-white border-orange-200'
        }`}>
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Radar className="w-48 h-48 text-orange-500" />
        </div>
        <div className="flex items-center gap-4 relative z-10 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center shadow-2xl">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sales Management Insight</h2>
            <p className="text-orange-500 font-bold uppercase text-[10px] tracking-widest mt-1">Autonomous Strategy Review</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-4">
            <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Signal Calibration Status</h4>
            <p className={`leading-relaxed italic ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              "Current hunting parameters show a 12% drift from high-margin targets. Your team is engaging with 'Emergency Site Protection' signals at 92% efficiency, but missing 'Competitive Expansion' triggers in the NT region."
            </p>
          </div>
          <div className={`p-6 rounded-2xl border backdrop-blur-md ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/60 border-gray-200'
            }`}>
            <h4 className="text-orange-500 font-bold text-xs uppercase mb-4 tracking-widest">Recommended Sales Mandate</h4>
            <p className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              Deploy regional reps to Pilbara specifically targeting heavy earthworks tender winners. The 'Competitor Insolvency' trigger is active; increase outbound aggression on Red Earth matched accounts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InsightsView;
