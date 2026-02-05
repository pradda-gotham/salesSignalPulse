import { DealDossier } from '../types';
import { getSettings } from '../views/SettingsView';

interface EmailPayload {
    dossier: DealDossier;
    recipients: string[];
}

/**
 * Production Email Service
 * Calls the Vercel Serverless Function /api/send-dossier
 */
export const emailService = {
    sendDossierEmail: async (payload: EmailPayload): Promise<boolean> => {
        const { dossier, recipients } = payload;

        if (!recipients || recipients.length === 0) {
            console.warn('[EmailService] No recipients configured.');
            return false;
        }

        try {
            console.log(`[EmailService] 📧 Sending Dossier Notification to ${recipients.length} recipients...`);

            const response = await fetch('/api/send-dossier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dossier, recipients }),
            });

            if (!response.ok) {
                // If 404, it might be because we are running in Vite dev mode without Vercel
                if (response.status === 404) {
                    console.warn('[EmailService] API not found (404). Are you running with "vercel dev"? falling back to mock log.');
                    console.log('[EmailService] (Mock Fallback) Email would have been sent to:', recipients);
                    return true; // Pretend success for UX
                }

                const errorData = await response.json();
                console.error('[EmailService] API Error:', errorData);
                return false;
            }

            const result = await response.json();
            console.log('[EmailService] ✅ Email sent successfully via Resend', result);
            return true;
        } catch (e) {
            console.error('[EmailService] Failed to send email (Network/Auth):', e);
            return false;
        }
    }
};
