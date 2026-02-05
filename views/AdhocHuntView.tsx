import React, { useState } from 'react';
import { BusinessProfile, SalesTrigger } from '../types';
import OnboardingView from './OnboardingView';
import { geminiService } from '../services/geminiService';
import { Loader2, Radar } from 'lucide-react';

interface AdhocHuntViewProps {
    onStartHunt: (profile: BusinessProfile, triggers: SalesTrigger[], region: string) => void;
}

/**
 * AdhocHuntView
 * Wraps the OnboardingView to allow manual "Session-based" hunting on any URL.
 * Does NOT overwrite the main organization profile.
 */
const AdhocHuntView: React.FC<AdhocHuntViewProps> = ({ onStartHunt }) => {
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

    // Called when user completes the Onboarding/Calibration flow
    const handleAdhocCalibration = async (profile: BusinessProfile) => {
        setIsGeneratingStrategy(true);
        try {
            // 1. Generate Triggers for this adhoc profile
            console.log("[ADHOC] Generating triggers for:", profile.name);

            // We assume geminiService.generateTriggers exists and works. 
            // If it requires a saved profile, we might need a workaround, but usually it just takes the object.
            const triggers = await geminiService.generateTriggers(profile);

            console.log("[ADHOC] Triggers generated:", triggers.length);

            // 2. Start the Hunt
            // Use the first region from the profile as default
            const region = profile.geography[0] || "Global";

            onStartHunt(profile, triggers, region);
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
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                    <Radar className="w-20 h-20 text-green-500 animate-spin relative z-10" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black">Initializing Hunter...</h2>
                    <p className="text-lg max-w-md mx-auto text-zinc-500">
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
