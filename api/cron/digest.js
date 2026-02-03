// Vercel Cron: Daily Email Digest
// Runs daily at 7 AM UTC to send signal digests to users

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const config = {
    runtime: 'edge',
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

export default async function handler(request) {
    // Verify cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production' && !request.headers.get('x-vercel-cron')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    console.log('[DIGEST] Starting daily email digest...');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[DIGEST] Missing Supabase credentials');
        return new Response(JSON.stringify({ error: 'Missing Supabase credentials' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!resendApiKey) {
        console.warn('[DIGEST] Missing Resend API key, skipping email delivery');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    try {
        // Get all organizations with their users who want digests
        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select(`
        id,
        name,
        users!inner (
          id,
          email,
          name,
          receives_digest
        )
      `)
            .eq('is_active', true);

        if (orgsError) {
            throw orgsError;
        }

        console.log(`[DIGEST] Processing ${orgs?.length || 0} organizations`);

        const results = [];

        for (const org of orgs || []) {
            try {
                // Get new signals from last 24 hours
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                const { data: signals, error: signalsError } = await supabase
                    .from('signals')
                    .select('*')
                    .eq('org_id', org.id)
                    .eq('status', 'new')
                    .gte('found_at', yesterday.toISOString())
                    .order('score', { ascending: false })
                    .limit(10);

                if (signalsError) {
                    console.error(`[DIGEST] Error fetching signals for ${org.name}:`, signalsError);
                    continue;
                }

                if (!signals || signals.length === 0) {
                    console.log(`[DIGEST] No new signals for ${org.name}, skipping`);
                    continue;
                }

                // Get users who want digest emails
                const digestRecipients = org.users.filter(u => u.receives_digest);

                if (digestRecipients.length === 0) {
                    console.log(`[DIGEST] No digest recipients for ${org.name}`);
                    continue;
                }

                // Build email content
                const emailHtml = buildDigestEmail(org.name, signals);

                // Send to each recipient
                for (const user of digestRecipients) {
                    if (resend) {
                        try {
                            await resend.emails.send({
                                from: 'SalesPulse <noreply@salespulse.dev>',
                                to: user.email,
                                subject: `🔥 ${signals.length} New Opportunity Signals - ${org.name}`,
                                html: emailHtml,
                            });
                            console.log(`[DIGEST] Sent email to ${user.email}`);
                        } catch (emailError) {
                            console.error(`[DIGEST] Failed to send to ${user.email}:`, emailError);
                        }
                    } else {
                        console.log(`[DIGEST] Would send to ${user.email} (Resend not configured)`);
                    }
                }

                // Mark signals as emailed
                const signalIds = signals.map(s => s.id);
                await supabase
                    .from('signals')
                    .update({ last_emailed_at: new Date().toISOString() })
                    .in('id', signalIds);

                results.push({
                    org: org.name,
                    signals: signals.length,
                    recipients: digestRecipients.length,
                    status: 'sent',
                });

            } catch (orgError) {
                console.error(`[DIGEST] Error processing ${org.name}:`, orgError);
                results.push({
                    org: org.name,
                    status: 'failed',
                    error: orgError.message,
                });
            }
        }

        console.log('[DIGEST] Completed');

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            results,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[DIGEST] Failed:', error);
        return new Response(JSON.stringify({
            error: 'Digest failed',
            details: error.message,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

function buildDigestEmail(orgName, signals) {
    const signalRows = signals.map(s => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #333;">
        <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">${escapeHtml(s.headline)}</div>
        <div style="font-size: 13px; color: #999;">${escapeHtml(s.summary?.substring(0, 100) || '')}...</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #333; text-align: center;">
        <span style="background: ${getScoreColor(s.score)}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ${s.score}
        </span>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #333; text-align: center;">
        <span style="background: ${getUrgencyColor(s.urgency)}; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
          ${s.urgency}
        </span>
      </td>
    </tr>
  `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #f97316; font-size: 24px; margin: 0;">⚡ SalesPulse</h1>
      <p style="color: #888; margin-top: 8px;">Daily Opportunity Digest for ${escapeHtml(orgName)}</p>
    </div>

    <!-- Summary -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 48px; font-weight: 700; color: #f97316;">${signals.length}</div>
      <div style="color: #888; font-size: 14px;">New Signals Discovered</div>
    </div>

    <!-- Signals Table -->
    <div style="background: #141414; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #1e1e2e;">
            <th style="padding: 12px 16px; text-align: left; color: #888; font-size: 12px; font-weight: 500; text-transform: uppercase;">Signal</th>
            <th style="padding: 12px 16px; text-align: center; color: #888; font-size: 12px; font-weight: 500; text-transform: uppercase;">Score</th>
            <th style="padding: 12px 16px; text-align: center; color: #888; font-size: 12px; font-weight: 500; text-transform: uppercase;">Urgency</th>
          </tr>
        </thead>
        <tbody>
          ${signalRows}
        </tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://sales-signal-pulse.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View All Signals →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
      <p>You're receiving this because you enabled daily digests.</p>
      <p>© ${new Date().getFullYear()} SalesPulse. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f97316';
    return '#6b7280';
}

function getUrgencyColor(urgency) {
    switch (urgency) {
        case 'emergency': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        default: return '#6b7280';
    }
}
