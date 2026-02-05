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
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background: #F7F7F9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6C5DD3 0%, #5A4DBF 100%); color: white; padding: 32px; border-radius: 24px 24px 0 0;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700;">⚡ Deal Dossier</h1>
              <p style="margin: 10px 0 0 0; font-size: 20px; opacity: 0.95; font-weight: 500;">${dossier.accountName}</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 32px; border-radius: 0 0 24px 24px; box-shadow: 0px 14px 40px rgba(33, 33, 33, 0.04);">
              
              <!-- Quick Stats Row -->
              <div style="display: flex; gap: 16px; margin-bottom: 28px;">
                <div style="flex: 1; background: linear-gradient(135deg, #6C5DD3 0%, #8B7FE0 100%); padding: 20px; border-radius: 16px; text-align: center;">
                  <div style="font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Deal Size</div>
                  <div style="font-size: 28px; font-weight: 700; color: white; margin-top: 6px;">
                    ${dossier.pricingStrategy?.estimatedValue ? '$' + dossier.pricingStrategy.estimatedValue.toLocaleString() : 'TBD'}
                  </div>
                </div>
                <div style="flex: 1; background: linear-gradient(135deg, #00C4FF 0%, #00A8E8 100%); padding: 20px; border-radius: 16px; text-align: center;">
                  <div style="font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Confidence</div>
                  <div style="font-size: 28px; font-weight: 700; color: white; margin-top: 6px;">${dossier.confidence || 'Medium'}</div>
                </div>
              </div>

              <!-- Executive Summary -->
              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #F0F0F5;">
                <div style="font-size: 11px; color: #808191; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 10px;">📋 Executive Summary</div>
                <p style="margin: 0; color: #1B1D21; line-height: 1.7; font-size: 15px;">${dossier.executiveSummary || 'N/A'}</p>
              </div>

              <!-- Commercial Opportunity -->
              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #F0F0F5;">
                <div style="font-size: 11px; color: #808191; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 10px;">💰 Commercial Opportunity</div>
                <p style="margin: 0; color: #1B1D21; line-height: 1.7; font-size: 15px;">${dossier.commercialOpportunity || 'N/A'}</p>
              </div>

              <!-- Product Recommendations -->
              ${dossier.recommendedBundle && dossier.recommendedBundle.length > 0 ? `
              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #F0F0F5;">
                <div style="font-size: 11px; color: #808191; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 14px;">📦 Products to Target</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #F7F7F9;">
                      <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #808191; font-weight: 600; border-radius: 8px 0 0 8px;">Product</th>
                      <th style="padding: 12px 16px; text-align: right; font-size: 12px; color: #808191; font-weight: 600; border-radius: 0 8px 8px 0;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dossier.recommendedBundle.map(item => `
                      <tr style="border-bottom: 1px solid #F0F0F5;">
                        <td style="padding: 14px 16px;">
                          <div style="font-weight: 600; color: #1B1D21;">${item.sku}</div>
                          <div style="font-size: 13px; color: #808191; margin-top: 2px;">${item.description || ''}</div>
                        </td>
                        <td style="padding: 14px 16px; font-weight: 700; color: #6C5DD3; text-align: right; font-size: 16px;">${item.quantity}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <!-- Company Info -->
              ${dossier.enrichedCompany ? `
              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #F0F0F5;">
                <div style="font-size: 11px; color: #808191; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 14px;">🏢 Company Details</div>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 6px 0; color: #808191; font-size: 13px; width: 100px;">Website</td>
                    <td style="padding: 6px 0;"><a href="https://${dossier.enrichedCompany.domain}" style="color: #6C5DD3; text-decoration: none; font-weight: 500;">${dossier.enrichedCompany.domain}</a></td>
                  </tr>
                  ${dossier.enrichedCompany.linkedinUrl ? `
                  <tr>
                    <td style="padding: 6px 0; color: #808191; font-size: 13px;">LinkedIn</td>
                    <td style="padding: 6px 0;"><a href="${dossier.enrichedCompany.linkedinUrl}" style="color: #0077b5; text-decoration: none; font-weight: 500;">🔗 Company Page</a></td>
                  </tr>
                  ` : ''}
                  ${dossier.enrichedCompany.industry ? `
                  <tr>
                    <td style="padding: 6px 0; color: #808191; font-size: 13px;">Industry</td>
                    <td style="padding: 6px 0; color: #1B1D21; font-weight: 500;">${dossier.enrichedCompany.industry}</td>
                  </tr>
                  ` : ''}
                  ${dossier.enrichedCompany.employeeCount ? `
                  <tr>
                    <td style="padding: 6px 0; color: #808191; font-size: 13px;">Employees</td>
                    <td style="padding: 6px 0; color: #1B1D21; font-weight: 500;">${dossier.enrichedCompany.employeeCount.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}

              <!-- All Contacts -->
              ${dossier.enrichedContacts && dossier.enrichedContacts.length > 0 ? `
              <div style="margin-bottom: 28px;">
                <div style="font-size: 11px; color: #808191; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 14px;">👥 Key Contacts (${dossier.enrichedContacts.length})</div>
                ${dossier.enrichedContacts.map((contact, index) => `
                  <div style="background: ${index === 0 ? 'linear-gradient(135deg, rgba(108,93,211,0.08) 0%, rgba(0,196,255,0.05) 100%)' : '#F7F7F9'}; border: 1px solid ${index === 0 ? 'rgba(108,93,211,0.2)' : '#F0F0F5'}; border-radius: 16px; padding: 18px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 700; color: #1B1D21; font-size: 16px;">${contact.name}</div>
                        <div style="color: #808191; font-size: 13px; margin-top: 3px;">${contact.title}</div>
                      </div>
                      ${index === 0 ? '<span style="background: linear-gradient(135deg, #6C5DD3 0%, #8B7FE0 100%); color: white; font-size: 10px; padding: 4px 10px; border-radius: 20px; font-weight: 600;">PRIMARY</span>' : ''}
                    </div>
                    <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 16px;">
                      ${contact.email ? `
                      <a href="mailto:${contact.email}" style="display: flex; align-items: center; gap: 6px; color: #1B1D21; text-decoration: none; font-size: 13px; font-weight: 500;">
                        ✉️ ${contact.email}
                      </a>
                      ` : ''}
                      ${contact.phone ? `
                      <a href="tel:${contact.phone}" style="display: flex; align-items: center; gap: 6px; color: #1B1D21; text-decoration: none; font-size: 13px; font-weight: 500;">
                        📞 ${contact.phone}
                      </a>
                      ` : ''}
                      ${contact.linkedinUrl ? `
                      <a href="${contact.linkedinUrl}" style="display: flex; align-items: center; gap: 6px; color: #0077b5; text-decoration: none; font-size: 13px; font-weight: 500;">
                        🔗 LinkedIn
                      </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 28px;">
                <a href="${process.env.VITE_APP_URL || 'https://aireadines.com'}" style="display: inline-block; background: linear-gradient(135deg, #6C5DD3 0%, #5A4DBF 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0px 4px 12px rgba(108, 93, 211, 0.4);">
                  View Full Dossier →
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 24px; color: #808191; font-size: 12px;">
              Powered by <span style="color: #6C5DD3; font-weight: 600;">SalesPulse</span> Autonomous Intelligence
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
