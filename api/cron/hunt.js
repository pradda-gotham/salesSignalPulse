// Vercel Cron: Daily Signal Hunt
// Runs daily at 6 AM UTC for all active organizations

import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request) {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // In development, allow without auth
        if (process.env.NODE_ENV === 'production' && !request.headers.get('x-vercel-cron')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    console.log('[CRON] Starting daily signal hunt...');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[CRON] Missing Supabase credentials');
        return new Response(JSON.stringify({ error: 'Missing credentials' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Use service role key for admin access (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Get all active organizations
        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, products, target_groups, geography, hunt_time, timezone')
            .eq('is_active', true);

        if (orgsError) {
            throw orgsError;
        }

        console.log(`[CRON] Found ${orgs?.length || 0} active organizations`);

        const results = [];

        for (const org of orgs || []) {
            try {
                // Get org's active triggers
                const { data: triggers, error: triggersError } = await supabase
                    .from('triggers')
                    .select('*')
                    .eq('org_id', org.id)
                    .eq('status', 'active');

                if (triggersError) {
                    console.error(`[CRON] Error fetching triggers for ${org.name}:`, triggersError);
                    continue;
                }

                if (!triggers || triggers.length === 0) {
                    console.log(`[CRON] No active triggers for ${org.name}, skipping`);
                    continue;
                }

                // Create hunt log entry
                const { data: huntLog, error: huntLogError } = await supabase
                    .from('hunt_logs')
                    .insert({
                        org_id: org.id,
                        started_at: new Date().toISOString(),
                        triggers_processed: triggers.length,
                    })
                    .select('id')
                    .single();

                if (huntLogError) {
                    console.error(`[CRON] Error creating hunt log:`, huntLogError);
                }

                // TODO: Integrate with Gemini signal hunting
                // For now, we just log the intent and mark as successful
                console.log(`[CRON] Would hunt ${triggers.length} triggers for ${org.name}`);

                // Update hunt log with results
                if (huntLog) {
                    await supabase
                        .from('hunt_logs')
                        .update({
                            completed_at: new Date().toISOString(),
                            signals_found: 0, // Will be updated when Gemini integration is added
                            new_signals: 0,
                            status: 'success',
                        })
                        .eq('id', huntLog.id);
                }

                results.push({
                    org: org.name,
                    triggers: triggers.length,
                    status: 'completed',
                });

            } catch (orgError) {
                console.error(`[CRON] Error processing ${org.name}:`, orgError);
                results.push({
                    org: org.name,
                    status: 'failed',
                    error: orgError.message,
                });
            }
        }

        console.log('[CRON] Daily hunt completed');

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            results,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[CRON] Hunt failed:', error);
        return new Response(JSON.stringify({
            error: 'Hunt failed',
            details: error.message,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
