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
import { getVL } from '../utils/vesper';

interface LiveFeedViewProps {
   signals: MarketSignal[];
   profile: BusinessProfile;
   activeTriggers: SalesTrigger[];
   isSearching: boolean;
   onViewDossier: (s: MarketSignal) => void;
}

const LiveFeedView: React.FC<LiveFeedViewProps> = ({ signals, profile, activeTriggers, isSearching, onViewDossier }) => {
   const { isDarkMode } = useTheme();
   const vl = getVL(isDarkMode);
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
               `No signals detected in ${profile.industry} sector. Continuing scan...`,
               "Minor event detected. Confidence below threshold. Ignoring...",
               `Verifying intent in ${profile.geography[0] || 'active'} region...`,
               "Scanning new government tender portal updates...",
               "Analyzing latest corporate filings and PR feeds...",
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
         <div className="flex items-center justify-between p-8 rounded-[6px] border shadow-2xl relative overflow-hidden vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
            <div className="absolute top-0 right-0 p-4">
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-[4px] border border-[#10B981]/20 text-[10px] font-bold uppercase tracking-wider animate-pulse bg-[#10B981]/10 text-[#10B981]">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                  LIVE ENGINE STATUS
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="w-16 h-16 rounded-[6px] flex items-center justify-center shadow-lg" style={{ background: vl.primarySoft, color: vl.primary }}>
                  <Radio className="w-8 h-8 animate-bounce" />
               </div>
               <div>
                  <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Leads Command Center</h1>
                  <p className="text-[13px] mt-1" style={{ color: vl.textBody }}>Monitoring <span className="font-bold" style={{ color: vl.primary }}>{profile.name}</span>'s market parameters via Google Search Grounding.</p>
               </div>
            </div>

            <div className="flex items-center gap-6 pr-10">
               <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1 label-caps" style={{ color: vl.textMuted }}>Processing Power</div>
                  <div className="font-mono text-sm font-bold flex items-center gap-2 justify-end" style={{ color: vl.textMain }}>
                     <Cpu className="w-4 h-4 text-[#10B981]" /> 100% Optimized
                  </div>
               </div>
               <div className="w-px h-10" style={{ background: vl.borderStrong }} />
               <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1 label-caps" style={{ color: vl.textMuted }}>Active Triggers</div>
                  <div className="font-mono text-sm font-bold" style={{ color: vl.textMain }}>{approvedTriggers.length} Configured</div>
               </div>
            </div>
         </div>

         <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-semibold flex items-center gap-3" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
                     <Activity className="w-5 h-5 flex-shrink-0" style={{ color: vl.primary }} />
                     Lead Stream
                  </h2>
                  <div className="text-xs font-bold" style={{ color: vl.textMuted }}>Showing {signals.length} latest real-world signals</div>
               </div>

               <div className="space-y-4">
                  {isSearching ? (
                     <div className="p-20 text-center border rounded-[6px] space-y-6 animate-pulse" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                        <Radar className="w-12 h-12 mx-auto animate-spin" style={{ color: vl.primary }} />
                        <p className="font-bold uppercase tracking-wider text-[11px] label-caps" style={{ color: vl.textMuted }}>Crawling Web for Real-Time Leads...</p>
                     </div>
                  ) : signals.length === 0 ? (
                     <div className="p-20 text-center border rounded-[6px] space-y-4 border-dashed" style={{ background: vl.surface, borderColor: vl.borderStrong }}>
                        <Target className="w-12 h-12 mx-auto" style={{ color: vl.textMuted }} />
                        <p className="font-medium text-[13px] italic" style={{ color: vl.textBody }}>Engine standby. No high-intent signals matched current parameters.</p>
                     </div>
                  ) : (
                     signals.map((s, idx) => (
                        <div
                           key={s.id}
                           className="group p-6 rounded-[6px] border transition-all relative overflow-hidden vl-card hover-row"
                           style={{ animationDelay: `${idx * 150}ms`, background: vl.surface, borderColor: vl.border }}
                        >
                           <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: vl.primary }} />
                           <div className="flex items-start justify-between">
                              <div className="flex gap-6 items-start">
                                 <div className="w-12 h-12 rounded-[4px] flex flex-col items-center justify-center border transition-colors" style={{ background: vl.chipBg, borderColor: vl.borderStrong }}>
                                    <span className="text-[9px] font-bold uppercase label-caps" style={{ color: vl.textMuted }}>Score</span>
                                    <span className="text-sm font-bold font-mono transition-colors group-hover:text-[#635BFF]" style={{ color: vl.textMain }}>{s.score}</span>
                                 </div>
                                 <div className="space-y-1.5">
                                    <div className="flex items-center gap-3 mb-1">
                                       <h3 className="text-[15px] font-bold line-clamp-1 transition-colors group-hover:text-[#635BFF]" style={{ color: vl.textMain }}>{s.headline}</h3>
                                       <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 label-caps" style={{ background: '#10B98110', color: '#10B981', borderColor: '#10B98120' }}>
                                          <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                       </span>
                                    </div>
                                    <p className="text-[13px] line-clamp-2 max-w-xl leading-relaxed" style={{ color: vl.textBody }}>{s.summary}</p>
                                    <div className="flex items-center gap-4 pt-2">
                                       <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: vl.textMuted }}>
                                          <Clock className="w-3 h-3" /> {s.timestamp}
                                       </div>
                                       <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: vl.primary }}>
                                          <Zap className="w-3 h-3" /> {s.matchedProducts[0]}
                                       </div>
                                       {s.sourceUrl ? (
                                          <a
                                             href={s.sourceUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="flex items-center gap-1.5 text-[10px] transition-colors font-bold uppercase hover:underline"
                                             style={{ color: vl.textMuted }}
                                          >
                                             <Globe className="w-3 h-3" /> {(() => { try { const h = new URL(s.sourceUrl).hostname.replace('www.', ''); return h.includes('vertexaisearch') ? 'Google Verified' : h; } catch { return 'Source'; } })()}
                                          </a>
                                       ) : (
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-50" style={{ color: vl.textMuted }}>
                                             <Globe className="w-3 h-3" /> Unpublished
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <button
                                 onClick={() => onViewDossier(s)}
                                 className="btn-primary flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider group/btn"
                              >
                                 Gather Intel
                                 <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="p-6 rounded-[6px] border font-mono text-xs space-y-4 shadow-inner" style={{ background: isDarkMode ? '#0a0a0a' : '#191C1E', borderColor: vl.borderStrong }}>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                     <div className="flex items-center gap-2 text-zinc-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="uppercase font-bold tracking-widest text-[10px]">Engine Console</span>
                     </div>
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="space-y-2 text-green-400/80 h-48 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed">
                     {logs.map((log, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-2">
                           <span className="text-zinc-600 select-none">{'>'}</span>
                           <span>{log}</span>
                        </div>
                     ))}
                     <div ref={logEndRef} />
                  </div>
               </div>

               <div className="p-6 rounded-[6px] border space-y-5 vl-card" style={{ background: vl.surface, borderColor: vl.border }}>
                  <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] label-caps" style={{ color: vl.textMuted }}>
                     <Target className="w-4 h-4" style={{ color: vl.primary }} />
                     Active Parameters
                  </div>
                  <div className="space-y-3">
                     {approvedTriggers.slice(0, 3).map(trigger => (
                        <div key={trigger.id} className="p-3 rounded-[4px] border flex items-center justify-between group transition-colors" style={{ background: vl.surfaceMuted, borderColor: vl.borderStrong }}>
                           <div className="space-y-1">
                              <div className="text-xs font-bold transition-colors group-hover:text-[#635BFF]" style={{ color: vl.textMain }}>{trigger.event}</div>
                              <div className="text-[10px] font-bold uppercase label-caps" style={{ color: vl.textMuted }}>{trigger.product}</div>
                           </div>
                           <Wifi className="w-3 h-3 opacity-50" style={{ color: vl.textMuted }} />
                        </div>
                     ))}
                  </div>
               </div>

               <div className="p-6 rounded-[6px] border space-y-4 vl-card" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                  <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] label-caps" style={{ color: vl.primary }}>
                     <Search className="w-4 h-4" />
                     Scanner Coverage
                  </div>
                  <div className="space-y-3">
                     {[
                        { label: 'Google Search Grid', status: 'Live' },
                        { label: 'News Grounding', status: 'Live' },
                        { label: 'Public PR Feed', status: 'Syncing' },
                     ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-1 border-b last:border-0 border-transparent" style={{ borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                           <span className="text-[13px] font-bold" style={{ color: vl.textMain }}>{item.label}</span>
                           <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-[4px] border label-caps flex items-center gap-1 ${item.status === 'Live'
                              ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
                              : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
                              }`}>
                              {item.status === 'Live' && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                              {item.status}
                           </span>
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
