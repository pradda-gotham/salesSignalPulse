import React, { useState } from 'react';
import { OnboardingModeSelector } from './OnboardingModeSelector';
import { SetupOrgView } from './SetupOrgView';
import OnboardingView from './OnboardingView';
import { BusinessProfile, SalesTrigger } from '../types';
import { geminiService } from '../services/geminiService';
import { Radar } from 'lucide-react';

interface OnboardingOrchestratorProps {
    onComplete: (profile: BusinessProfile, aiTriggers: SalesTrigger[]) => void;
}

type OnboardingStep = 'select' | 'auto' | 'manual' | 'calibrating';

export const OnboardingOrchestrator: React.FC<OnboardingOrchestratorProps> = ({ onComplete }) => {
    const [step, setStep] = useState<OnboardingStep>('select');
    const [initialProfile, setInitialProfile] = useState<BusinessProfile | null>(null);
    const [verifiedProfile, setVerifiedProfile] = useState<BusinessProfile | null>(null);

    const handleModeSelect = (mode: 'auto' | 'manual') => {
        if (mode === 'manual') {
            setInitialProfile(null);
            setStep('manual');
        } else {
            setStep('auto');
        }
    };

    const handleAutoProfileComplete = (profile: BusinessProfile) => {
        setInitialProfile(profile);
        setStep('manual');
    };

    // After org setup is complete, run calibration
    const handleOrgSetupComplete = (profile: BusinessProfile) => {
        setVerifiedProfile(profile);
        setStep('calibrating');
        runCalibration(profile);
    };

    // Run AI calibration to generate triggers
    const runCalibration = async (profile: BusinessProfile) => {
        try {
            console.log('[Onboarding] Running calibration for:', profile.name);
            const triggers = await geminiService.generateTriggers(profile);
            console.log('[Onboarding] Calibration complete, generated', triggers.length, 'triggers');
            onComplete(profile, triggers);
        } catch (e) {
            console.error('[Onboarding] Calibration failed:', e);
            // Even if calibration fails, let user proceed with no AI triggers
            onComplete(profile, []);
        }
    };

    switch (step) {
        case 'select':
            return <OnboardingModeSelector onSelect={handleModeSelect} />;

        case 'auto':
            return (
                <div className="max-w-5xl mx-auto">
                    <OnboardingView onVerified={handleAutoProfileComplete} autoPilotMode={true} />
                </div>
            );

        case 'manual':
            return (
                <SetupOrgView
                    onComplete={handleOrgSetupComplete}
                    initialProfile={initialProfile}
                />
            );

        case 'calibrating':
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                        <Radar className="w-20 h-20 text-indigo-500 animate-spin relative z-10" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black">Calibrating Signal Engine...</h2>
                        <p className="text-lg max-w-md mx-auto text-zinc-500">
                            Analyzing your products and target segments to generate intelligent sales triggers.
                        </p>
                    </div>
                </div>
            );

        default:
            return null;
    }
};
