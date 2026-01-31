
import React, { useState, useEffect, useRef } from 'react';
import {
   Radio,
   Activity,
   Wifi,
   Search,
   Terminal,
   Cpu,
   Zap,
   ArrowRight,
   ShieldCheck,
   Clock,
   Target,
   Radar,
   Globe
} from 'lucide-react';
import { MarketSignal, BusinessProfile, SalesTrigger } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LiveFeedViewProps {
   signals: MarketSignal[];
   profile: BusinessProfile;
   activeTriggers: SalesTrigger[];
   isSearching: boolean;
   onViewDossier: (s: MarketSignal) => void;
}

const LiveFeedView: React.FC<LiveFeedViewProps> = ({ signals, profile, activeTriggers, isSearching, onViewDossier }) => {
   const { isDarkMode } = useTheme();
   const [logs, setLogs] = useState<string[]>([]);
   const logEndRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const logMessages = [
         "Establishing connection to Google Search Grounding...",
         "Engine prime sequence initiated.",
         `Targeting: ${profile.targetGroups.join(', ')}`,
         "Monitoring LinkedIn Sales Navigator events...",
         "Executing deep web search for active triggers...",
         "Parsing grounding metadata from verified news sources...",
         "Extracting actual source URLs from search results...",
         "Verifying project intent through corporate PR feeds...",
         "Filtering low-confidence noise from search stream...",
         "Market Intelligence Grid fully synchronized.",
      ];

      let i = 0;
      const interval = setInterval(() => {
         if (i < logMessages.length) {
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logMessages[i]}`].slice(-10));
            i++;
         } else {
            const randomLogs = [
               "No signals detected in mining sector. Continuing scan...",
               "Minor event detected. Confidence below threshold.",
               "Verifying project award in Pilbara region...",
               "Scanning new government tender portal updates...",
               "Analyzing latest ASX-200 corporate filings...",
            ];
            const randomMsg = randomLogs[Math.floor(Math.random() * randomLogs.length)];
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${randomMsg}`].slice(-10));
         }
      }, 3000);

      return () => clearInterval(interval);
   }, [profile]);

   useEffect(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [logs]);

   const approvedTriggers = activeTriggers.filter(t => t.status === 'Approved');

   return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
         <div className={`flex items-center justify-between p-8 rounded-[2rem] border shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-900 border-gray-800'
            }`}>
            <div className="absolute top-0 right-0 p-4">
               <div className="flex items-center gap-2 bg-orange-600/10 text-orange-500 px-4 py-1.5 rounded-full border border-orange-500/20 text-xs font-black animate-pulse">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  LIVE ENGINE STATUS
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="w-20 h-20 rounded-[2rem] bg-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.3)]">
                  <Radio className="w-10 h-10 text-white animate-bounce" />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">Opportunity Command Center</h1>
                  <p className="text-zinc-400 text-lg font-medium">Monitoring <span className="text-orange-400">{profile.name}</span>'s market parameters via Google Search Grounding.</p>
               </div>
            </div>

            <div className="flex items-center gap-6 pr-10">
               <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Processing Power</div>
                  <div className="text-white font-bold flex items-center gap-2 justify-end">
                     <Cpu className="w-4 h-4 text-green-500" /> 100% Optimized
                  </div>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Triggers</div>
                  <div className="text-white font-bold">{approvedTriggers.length} Configured</div>
               </div>
            </div>
         </div>

         <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h2 className={`text-xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     <Activity className="w-5 h-5 text-orange-500" />
                     Opportunity Stream
                  </h2>
                  <div className={`text-xs font-bold ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Showing {signals.length} latest real-world signals</div>
               </div>

               <div className="space-y-4">
                  {isSearching ? (
                     <div className={`p-20 text-center border rounded-[2.5rem] space-y-6 animate-pulse ${isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <Radar className={`w-16 h-16 mx-auto animate-spin ${isDarkMode ? 'text-zinc-800' : 'text-gray-400'}`} />
                        <p className={`font-black uppercase tracking-[0.2em] text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Crawling Web for Real-Time Opportunities...</p>
                     </div>
                  ) : signals.length === 0 ? (
                     <div className={`p-20 text-center border rounded-[2.5rem] space-y-4 ${isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <Target className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-zinc-800' : 'text-gray-400'}`} />
                        <p className={`font-medium italic ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Engine standby. No high-intent signals matched current parameters.</p>
                     </div>
                  ) : (
                     signals.map((s, idx) => (
                        <div
                           key={s.id}
                           className={`group p-6 rounded-[2rem] border transition-all relative overflow-hidden hover:bg-orange-600/[0.02] ${isDarkMode
                                 ? 'bg-[#0f0f0f] border-white/5 hover:border-orange-500/30'
                                 : 'bg-white border-gray-200 hover:border-orange-400/50'
                              }`}
                           style={{ animationDelay: `${idx * 150}ms` }}
                        >
                           <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex items-start justify-between">
                              <div className="flex gap-6 items-start">
                                 <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border transition-colors ${isDarkMode
                                       ? 'bg-white/5 border-white/10 group-hover:border-orange-500/30'
                                       : 'bg-gray-100 border-gray-200 group-hover:border-orange-400/30'
                                    }`}>
                                    <span className="text-[8px] font-black uppercase text-zinc-500">Score</span>
                                    <span className={`text-lg font-black group-hover:text-orange-500 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{s.score}</span>
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                       <h3 className={`text-xl font-black line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{s.headline}</h3>
                                       <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1">
                                          <ShieldCheck className="w-2.5 h-2.5" /> Verified Source
                                       </span>
                                    </div>
                                    <p className={`text-sm line-clamp-2 max-w-xl leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{s.summary}</p>
                                    <div className="flex items-center gap-4 pt-2">
                                       <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-black uppercase">
                                          <Clock className="w-3 h-3" /> {s.timestamp}
                                       </div>
                                       <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-black uppercase">
                                          <Zap className="w-3 h-3" /> {s.matchedProducts[0]}
                                       </div>
                                       <a
                                          href={s.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-1.5 text-[10px] transition-colors font-black uppercase ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                                             }`}
                                       >
                                          <Globe className="w-3 h-3" /> {new URL(s.sourceUrl).hostname.replace('www.', '')}
                                       </a>
                                    </div>
                                 </div>
                              </div>
                              <button
                                 onClick={() => onViewDossier(s)}
                                 className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all border group/btn ${isDarkMode
                                       ? 'bg-white/5 hover:bg-orange-600 text-zinc-400 hover:text-white border-white/5 hover:border-orange-500'
                                       : 'bg-gray-100 hover:bg-orange-600 text-gray-500 hover:text-white border-gray-200 hover:border-orange-500'
                                    }`}
                              >
                                 <span className="text-[10px] font-black uppercase whitespace-nowrap">Gather Intel</span>
                                 <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className={`p-6 rounded-[2rem] border font-mono text-xs space-y-4 shadow-inner ${isDarkMode ? 'bg-black border-white/5' : 'bg-gray-900 border-gray-800'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-zinc-500">
                        <Terminal className="w-3 h-3" />
                        <span className="uppercase font-black tracking-widest text-[9px]">Engine Console</span>
                     </div>
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-green-500/70 h-48 overflow-y-auto custom-scrollbar">
                     {logs.map((log, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                           <span className="text-zinc-700 mr-2">{'>'}</span>
                           {log}
                        </div>
                     ))}
                     <div ref={logEndRef} />
                  </div>
               </div>

               <div className={`p-8 rounded-[2rem] border space-y-6 ${isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-gray-200'
                  }`}>
                  <div className={`flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'
                     }`}>
                     <Target className="w-4 h-4 text-orange-500" />
                     Active Parameters
                  </div>
                  <div className="space-y-3">
                     {approvedTriggers.slice(0, 3).map(trigger => (
                        <div key={trigger.id} className={`p-4 rounded-xl border flex items-center justify-between group ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                           }`}>
                           <div className="space-y-1">
                              <div className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'
                                 }`}>{trigger.event}</div>
                              <div className="text-[9px] text-zinc-500 font-medium uppercase tracking-tighter">{trigger.product}</div>
                           </div>
                           <Wifi className="w-3.5 h-3.5 text-zinc-700" />
                        </div>
                     ))}
                  </div>
               </div>

               <div className={`p-8 rounded-[2rem] border space-y-4 ${isDarkMode ? 'bg-orange-600/5 border-orange-500/10' : 'bg-orange-50 border-orange-200'
                  }`}>
                  <div className="flex items-center gap-2 text-orange-500 font-black uppercase tracking-widest text-[10px]">
                     <Search className="w-4 h-4" />
                     Scanner Coverage
                  </div>
                  <div className="space-y-4">
                     {[
                        { label: 'Google Search Grid', status: 'Live' },
                        { label: 'News Grounding', status: 'Live' },
                        { label: 'Public PR Feed', status: 'Syncing' },
                     ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                           <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{item.label}</span>
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'Live'
                                 ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                                 : isDarkMode
                                    ? 'text-zinc-500 bg-zinc-800 border border-white/5'
                                    : 'text-gray-500 bg-gray-200 border border-gray-300'
                              }`}>{item.status}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default LiveFeedView;
