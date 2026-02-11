import React, { useState } from 'react';
import { OnboardingModeSelector } from './OnboardingModeSelector';
import { SetupOrgView } from './SetupOrgView';
import OnboardingView from './OnboardingView';
import { BusinessProfile } from '../types';

interface OnboardingOrchestratorProps {
    onComplete: () => void;
}

type OnboardingStep = 'select' | 'auto' | 'manual';

export const OnboardingOrchestrator: React.FC<OnboardingOrchestratorProps> = ({ onComplete }) => {
    const [step, setStep] = useState<OnboardingStep>('select');
    const [initialProfile, setInitialProfile] = useState<BusinessProfile | null>(null);

    const handleModeSelect = (mode: 'auto' | 'manual') => {
        if (mode === 'manual') {
            // Direct to form with empty profile
            setInitialProfile(null);
            setStep('manual');
        } else {
            // Go to profiling view
            setStep('auto');
        }
    };

    const handleAutoProfileComplete = (profile: BusinessProfile) => {
        // Profiling done, move to form with pre-filled data
        setInitialProfile(profile);
        setStep('manual');
    };

    // Render based on current step
    switch (step) {
        case 'select':
            return <OnboardingModeSelector onSelect={handleModeSelect} />;

        case 'auto':
            return (
                <div className="max-w-5xl mx-auto">
                    {/* Reuse the existing OnboardingView for calibration/profiling */}
                    <OnboardingView onVerified={handleAutoProfileComplete} autoPilotMode={true} />
                </div>
            );

        case 'manual':
            return (
                <SetupOrgView
                    onComplete={onComplete}
                    initialProfile={initialProfile}
                />
            );

        default:
            return null;
    }
};
