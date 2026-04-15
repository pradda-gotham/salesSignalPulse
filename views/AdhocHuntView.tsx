import React, { useState } from 'react';
import { BusinessProfile, SalesTrigger } from '../types';
import OnboardingView from './OnboardingView';
import { geminiService } from '../services/geminiService';
import { Loader2, Radar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getVL } from '../utils/vesper';

interface AdhocHuntViewProps {
    onCalibrationComplete: (profile: BusinessProfile, triggers: SalesTrigger[]) => void;
}

/**
 * AdhocHuntView
 * Wraps the OnboardingView to allow manual "Session-based" hunting on any URL.
 * Does NOT overwrite the main organization profile.
 */
const AdhocHuntView: React.FC<AdhocHuntViewProps> = ({ onCalibrationComplete }) => {
    const { isDarkMode } = useTheme();
    const vl = getVL(isDarkMode);
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

    // Called when user completes the Onboarding/Calibration flow
    const handleAdhocCalibration = async (profile: BusinessProfile) => {
        setIsGeneratingStrategy(true);
        try {
            // 1. Generate Triggers for this adhoc profile
            console.log("[ADHOC] Generating triggers for:", profile.name);

            const triggers = await geminiService.generateTriggers(profile);

            console.log("[ADHOC] Triggers generated:", triggers.length);

            // 2. Navigate to Setup for review (consistent with legacy flow)
            onCalibrationComplete(profile, triggers);
        } catch (e) {
            console.error("[ADHOC] Error generating strategy:", e);
            alert("Failed to generate hunt strategy. Please try again.");
            setIsGeneratingStrategy(false);
        }
    };

    if (isGeneratingStrategy) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: vl.primarySoft }}></div>
                    <Radar className="w-20 h-20 animate-spin relative z-10" style={{ color: vl.primary }} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Newsreader', Georgia, serif", color: vl.textMain }}>Initializing Hunter...</h2>
                    <p className="text-[13px] max-w-md mx-auto" style={{ color: vl.textBody }}>
                        Calibrating search parameters and generating real-time triggers for your session.
                    </p>
                </div>
            </div>
        );
    }

    // Reuse the existing OnboardingView
    return (
        <div className="max-w-5xl mx-auto">
            <OnboardingView onVerified={handleAdhocCalibration} />
        </div>
    );
};

export default AdhocHuntView;
