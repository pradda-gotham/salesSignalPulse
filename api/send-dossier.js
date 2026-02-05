import { Resend } from 'resend';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return new Response('Missing RESEND_API_KEY', { status: 500 });
    }

    try {
        const { dossier, recipients } = await req.json();

        if (!dossier || !recipients || recipients.length === 0) {
            return new Response('Missing required fields', { status: 400 });
        }

        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: 'SalesPulse Intelligence <onboarding@resend.dev>', // Default testing domain
            to: recipients,
            subject: `Deal Dossier: ${dossier.accountName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { border: 1px solid #ddd; padding: 20px; border-top: none; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; font-size: 0.9em; text-transform: uppercase; }
            .value { margin-top: 5px; }
            .contact-card { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .btn { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0">Deal Dossier: ${dossier.accountName}</h2>
            </div>
            <div class="content">
              <div class="section">
                <div class="label">Executive Summary</div>
                <div class="value">${dossier.executiveSummary}</div>
              </div>
              
              <div class="section">
                <div class="label">Commercial Opportunity</div>
                <div class="value">${dossier.commercialOpportunity}</div>
              </div>

              ${dossier.enrichedContacts && dossier.enrichedContacts.length > 0 ? `
                <div class="contact-card">
                  <div class="label">Key Contact</div>
                  <div class="value">
                    <strong>${dossier.enrichedContacts[0].name}</strong><br>
                    ${dossier.enrichedContacts[0].title}<br>
                    <a href="mailto:${dossier.enrichedContacts[0].email}">${dossier.enrichedContacts[0].email}</a><br>
                    ${dossier.enrichedContacts[0].linkedin ? `<a href="${dossier.enrichedContacts[0].linkedin}">LinkedIn Profile</a>` : ''}
                  </div>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}" class="btn">View Full Dossier</a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
              Powered by SalesPulse Autonomous Intelligence
            </div>
          </div>
        </body>
        </html>
      `
        });

        if (error) {
            console.error('Resend Error:', error);
            return new Response(JSON.stringify({ error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        console.error('Server Error:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
