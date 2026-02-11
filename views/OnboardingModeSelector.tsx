import React from 'react';
import { Rocket, Edit3, ArrowRight } from 'lucide-react';

interface OnboardingModeSelectorProps {
    onSelect: (mode: 'auto' | 'manual') => void;
}

export const OnboardingModeSelector: React.FC<OnboardingModeSelectorProps> = ({ onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
            <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-4xl font-black text-[#1B1D21] mb-4">
                    How would you like to start?
                </h1>
                <p className="text-[#808191] text-lg">
                    Choose the best way to set up your organization's sales intelligence engine.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
                {/* Auto-Pilot Card */}
                <button
                    onClick={() => onSelect('auto')}
                    className="group relative flex flex-col items-start p-8 bg-white border border-gray-200 rounded-3xl hover:border-[#6C5DD3] hover:shadow-xl hover:shadow-[#6C5DD3]/10 transition-all duration-300 text-left"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#6C5DD3] to-[#8B7DE8] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#6C5DD3]/20 group-hover:scale-110 transition-transform duration-300">
                        <Rocket className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1B1D21] mb-2 group-hover:text-[#6C5DD3] transition-colors">
                        Auto-Pilot Setup
                    </h3>
                    <p className="text-[#808191] text-sm leading-relaxed mb-6">
                        Enter your company website URL and let our AI analyze your business, products, and target market automatically.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-[#6C5DD3] font-bold text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Start Auto-Pilot <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Recommended
                    </div>
                </button>

                {/* Manual Setup Card */}
                <button
                    onClick={() => onSelect('manual')}
                    className="group relative flex flex-col items-start p-8 bg-white border border-gray-200 rounded-3xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 text-left"
                >
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors duration-300">
                        <Edit3 className="w-7 h-7 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1B1D21] mb-2 group-hover:text-gray-900 transition-colors">
                        Manual Configuration
                    </h3>
                    <p className="text-[#808191] text-sm leading-relaxed mb-6">
                        Prefer to fill in the details yourself? Manually enter your industry, products, and target demographics.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-gray-900 font-bold text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Configure Manually <ArrowRight className="w-4 h-4" />
                    </div>
                </button>
            </div>
        </div>
    );
};
