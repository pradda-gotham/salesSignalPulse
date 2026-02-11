import * as XLSX from 'xlsx';
import { MarketSignal, DealDossier } from '../types';

/**
 * Export hunt signals to an Excel file.
 * For signals with a dossier, includes opportunity size and key contacts.
 * For signals without a dossier, those columns are left empty.
 */
export function exportSignalsToExcel(
    signals: MarketSignal[],
    dossierMap: Record<string, DealDossier>,
    filename?: string
): void {
    const rows = signals.map(signal => {
        const dossier = dossierMap[signal.id];

        // Build contact details string
        let contactDetails = '';
        if (dossier) {
            const parts: string[] = [];
            if (dossier.keyPersonName) {
                parts.push(dossier.keyPersonName);
            }
            if (dossier.enrichedContacts && dossier.enrichedContacts.length > 0) {
                for (const contact of dossier.enrichedContacts.slice(0, 3)) {
                    const contactStr = [
                        contact.name,
                        contact.title,
                        contact.email,
                        contact.phone,
                    ].filter(Boolean).join(' | ');
                    parts.push(contactStr);
                }
            }
            contactDetails = parts.join('\n');
        }
        if (!contactDetails && signal.decisionMaker) {
            contactDetails = signal.decisionMaker;
        }

        // Format opportunity size
        let opportunitySize = '';
        if (dossier?.pricingStrategy?.estimatedValue !== undefined && dossier.pricingStrategy.estimatedValue !== null) {
            opportunitySize = `$${dossier.pricingStrategy.estimatedValue.toLocaleString()}`;
        }

        // Format date
        let newsDate = '';
        try {
            const date = new Date(signal.timestamp);
            newsDate = date.toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            newsDate = signal.timestamp;
        }

        return {
            'Brief Description': signal.summary,
            'News Date': newsDate,
            'Headline': signal.headline,
            'Anticipated Product': signal.matchedProducts?.join(', ') || '',
            'Size of Opportunity': opportunitySize,
            'Key Contact Details': contactDetails,
        };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths for readability
    worksheet['!cols'] = [
        { wch: 50 },  // Brief Description
        { wch: 14 },  // News Date
        { wch: 40 },  // Headline
        { wch: 30 },  // Anticipated Product
        { wch: 20 },  // Size of Opportunity
        { wch: 40 },  // Key Contact Details
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hunt Signals');

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const exportFilename = filename || `PulseSignal_Hunt_${dateStr}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, exportFilename);
}
