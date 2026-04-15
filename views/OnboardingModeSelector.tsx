import React from 'react';
import { Rocket, Edit3, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface OnboardingModeSelectorProps {
    onSelect: (mode: 'auto' | 'manual') => void;
}

export const OnboardingModeSelector: React.FC<OnboardingModeSelectorProps> = ({ onSelect }) => {
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
            <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-4xl font-semibold mb-4 tracking-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>
                    How would you like to start?
                </h1>
                <p className="text-[15px]" style={{ color: vl.textBody }}>
                    Choose the best way to set up your organization's sales intelligence engine.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
                {/* Auto-Pilot Card */}
                <button
                    onClick={() => onSelect('auto')}
                    className="group relative flex flex-col items-start p-8 rounded-[6px] border transition-all duration-300 text-left vl-card hover-row"
                    style={{ background: vl.surface, borderColor: vl.border }}
                >
                    <div className="w-14 h-14 rounded-[4px] flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110" style={{ background: vl.primarySoft, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                        <Rocket className="w-7 h-7" style={{ color: vl.primary }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: vl.textMain }}>
                        Auto-Pilot Setup
                    </h3>
                    <p className="text-[13px] leading-relaxed mb-6" style={{ color: vl.textBody }}>
                        Enter your company website URL and let Leadpulse analyze your business, products, and target market automatically.
                    </p>
                    <div className="mt-auto flex items-center gap-2 font-bold text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 label-caps" style={{ color: vl.primary }}>
                        Start Auto-Pilot <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-[4px] uppercase tracking-wide border label-caps" style={{ background: vl.primarySoft, color: vl.primary, borderColor: isDarkMode ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)' }}>
                        Recommended
                    </div>
                </button>

                {/* Manual Setup Card */}
                <button
                    onClick={() => onSelect('manual')}
                    className="group relative flex flex-col items-start p-8 rounded-[6px] border transition-all duration-300 text-left vl-card hover-row"
                    style={{ background: vl.surface, borderColor: vl.border }}
                >
                    <div className="w-14 h-14 rounded-[4px] flex items-center justify-center mb-6 transition-colors duration-300 border" style={{ background: vl.chipBg, borderColor: vl.borderStrong }}>
                        <Edit3 className="w-7 h-7" style={{ color: vl.textMuted }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 transition-colors group-hover:text-[#635BFF]" style={{ color: vl.textMain }}>
                        Manual Configuration
                    </h3>
                    <p className="text-[13px] leading-relaxed mb-6" style={{ color: vl.textBody }}>
                        Prefer to fill in the details yourself? Manually enter your industry, products, and target demographics.
                    </p>
                    <div className="mt-auto flex items-center gap-2 font-bold text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 label-caps" style={{ color: vl.textMain }}>
                        Configure Manually <ArrowRight className="w-4 h-4" />
                    </div>
                </button>
            </div>
        </div>
    );
};
