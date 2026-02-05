import { Resend } from 'resend';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[EMAIL] Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  }

  try {
    // req.body is already parsed by Vercel
    const { dossier, recipients } = req.body || {};

    if (!dossier || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: dossier and recipients' });
    }

    console.log(`[EMAIL] Sending dossier for ${dossier.accountName} to ${recipients.length} recipients`);

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'SalesPulse Intelligence <notifications@aireadines.com>',
      to: recipients,
      subject: `Deal Dossier: ${dossier.accountName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🎯 Deal Dossier</h1>
              <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.95;">${dossier.accountName}</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 24px; border: 1px solid #e5e5e5; border-top: none;">
              
              <!-- Quick Stats Row -->
              <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                <div style="flex: 1; background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Deal Size</div>
                  <div style="font-size: 24px; font-weight: 700; color: #78350f; margin-top: 4px;">
                    ${dossier.pricingStrategy?.estimatedValue ? '$' + dossier.pricingStrategy.estimatedValue.toLocaleString() : 'TBD'}
                  </div>
                </div>
                <div style="flex: 1; background: #dbeafe; padding: 16px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600;">Confidence</div>
                  <div style="font-size: 24px; font-weight: 700; color: #1e3a8a; margin-top: 4px;">${dossier.confidence || 'Medium'}</div>
                </div>
              </div>

              <!-- Executive Summary -->
              <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px;">📋 Executive Summary</div>
                <p style="margin: 0; color: #374151; line-height: 1.6;">${dossier.executiveSummary || 'N/A'}</p>
              </div>

              <!-- Commercial Opportunity -->
              <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px;">💰 Commercial Opportunity</div>
                <p style="margin: 0; color: #374151; line-height: 1.6;">${dossier.commercialOpportunity || 'N/A'}</p>
              </div>

              <!-- Product Recommendations -->
              ${dossier.recommendedBundle && dossier.recommendedBundle.length > 0 ? `
              <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px;">📦 Products to Target</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Product</th>
                      <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dossier.recommendedBundle.map(item => `
                      <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 10px 12px;">
                          <div style="font-weight: 600; color: #111827;">${item.sku}</div>
                          <div style="font-size: 12px; color: #6b7280;">${item.description || ''}</div>
                        </td>
                        <td style="padding: 10px 12px; font-weight: 600; color: #f97316;">${item.quantity}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <!-- Company Info -->
              ${dossier.enrichedCompany ? `
              <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px;">🏢 Company Details</div>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 120px;">Website</td>
                    <td style="padding: 4px 0;"><a href="https://${dossier.enrichedCompany.domain}" style="color: #f97316; text-decoration: none;">${dossier.enrichedCompany.domain}</a></td>
                  </tr>
                  ${dossier.enrichedCompany.linkedinUrl ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">LinkedIn</td>
                    <td style="padding: 4px 0;"><a href="${dossier.enrichedCompany.linkedinUrl}" style="color: #0077b5; text-decoration: none;">🔗 Company Page</a></td>
                  </tr>
                  ` : ''}
                  ${dossier.enrichedCompany.industry ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Industry</td>
                    <td style="padding: 4px 0; color: #374151;">${dossier.enrichedCompany.industry}</td>
                  </tr>
                  ` : ''}
                  ${dossier.enrichedCompany.employeeCount ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Employees</td>
                    <td style="padding: 4px 0; color: #374151;">${dossier.enrichedCompany.employeeCount.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}

              <!-- All Contacts -->
              ${dossier.enrichedContacts && dossier.enrichedContacts.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px;">👥 Key Contacts (${dossier.enrichedContacts.length})</div>
                ${dossier.enrichedContacts.map((contact, index) => `
                  <div style="background: ${index === 0 ? '#fff7ed' : '#f9fafb'}; border: 1px solid ${index === 0 ? '#fed7aa' : '#e5e7eb'}; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 700; color: #111827; font-size: 15px;">${contact.name}</div>
                        <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">${contact.title}</div>
                      </div>
                      ${index === 0 ? '<span style="background: #f97316; color: white; font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 600;">PRIMARY</span>' : ''}
                    </div>
                    <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px;">
                      ${contact.email ? `
                      <a href="mailto:${contact.email}" style="display: flex; align-items: center; gap: 4px; color: #374151; text-decoration: none; font-size: 13px;">
                        ✉️ ${contact.email}
                      </a>
                      ` : ''}
                      ${contact.phone ? `
                      <a href="tel:${contact.phone}" style="display: flex; align-items: center; gap: 4px; color: #374151; text-decoration: none; font-size: 13px;">
                        📞 ${contact.phone}
                      </a>
                      ` : ''}
                      ${contact.linkedinUrl ? `
                      <a href="${contact.linkedinUrl}" style="display: flex; align-items: center; gap: 4px; color: #0077b5; text-decoration: none; font-size: 13px;">
                        🔗 LinkedIn Profile
                      </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.VITE_APP_URL || 'https://aireadines.com'}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  View Full Dossier →
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-radius: 0 0 12px 12px;">
              Powered by SalesPulse Autonomous Intelligence
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[EMAIL] Resend Error:', error);
      return res.status(400).json({ error });
    }

    console.log('[EMAIL] Successfully sent:', data);
    return res.status(200).json({ data });

  } catch (e) {
    console.error('[EMAIL] Server Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
