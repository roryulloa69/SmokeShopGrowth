'use strict';

const db = require('./db');
const cron = require('node-cron');

/**
 * The Cron Manager orchestrates the entire background automation for Smokeshop Growth.
 * 
 * Functions:
 * 1. Process `queued_for_call` leads (* * * * * - every minute to prevent overlap)
 * 2. Process follow-up drips (0 * * * * - once per hour)
 */

class PipelineCron {
    constructor() {
        this.isCalling = false;
        this.isDripping = false;
    }

    start() {
        console.log('🕒 Pipeline Cron Started: Polling queue and sequences using node-cron...');
        
        // Polling loop for AI calls: every 1 minute
        cron.schedule('* * * * *', () => {
            this.processCallQueue();
        });
        
        // Follow-up drip sequence: top of every hour
        cron.schedule('0 * * * *', () => {
            this.processDripQueue();
        });

        // Initial quick check immediately on boot
        setTimeout(() => this.processCallQueue(), 5000);
        setTimeout(() => this.processDripQueue(), 10000);
    }

    async processCallQueue() {
        if (this.isCalling) return;
        this.isCalling = true;

        try {
            // Find 1 lead queued for a call
            // Since there's no native "getQueued" we can use the stage fetching
            const leads = db.getLeadsByStagePaginated.all('queued_for_call', 1, 0);
            
            if (!leads || leads.length === 0) {
                // No leads queued
                this.isCalling = false;
                return;
            }

            const lead = leads[0];
            console.log(`[CRON] Initiating AI Call to lead: ${lead.business_name} (${lead.phone})`);

            // Optimistic stage update to prevent double dialing
            db.updateLeadStage.run('called', lead.place_id);

            // Log interaction
            db.logInteraction.run(lead.place_id, 'call', 'Dialing AI Agent via ElevenLabs');

            // Trigger the internal webhook to start the ElevenLabs call
            // In a real prod environment with multiple instances, use hard URL. Here, call the internal logic or self-fetch.
            const apiUrl = `http://localhost:${process.env.PORT || 3000}/webhook/call`;
            
            const reqBody = {
                place_id: lead.place_id,
                business_name: lead.business_name,
                phone: lead.phone,
                city: lead.locality || lead.city || '',
                agent_name: process.env.AGENT_NAME || 'Alex',
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.API_KEY || ''
                },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errData = await response.text();
                throw new Error(errData);
            }

            console.log(`[CRON] AI Call dispatched successfully for ${lead.place_id}`);

        } catch (err) {
            console.error('[CRON] Error processing call queue:', err);
        } finally {
            this.isCalling = false;
        }
    }

    async processDripQueue() {
        if (this.isDripping) return;
        this.isDripping = true;

        console.log('[CRON] Checking for follow-up drips...');

        try {
            // In a real production system, you'd select ALL leads in `demo_sent` or `followup_active`
            // and check if `(Date.now() - updated_at) > (DAYS * 24 * 60 * 60 * 1000)`
            // Here we just write the scaffolding for the heuristic rules.
            const leads = db.db.prepare(`
                SELECT * FROM leads 
                WHERE crm_stage IN ('demo_sent', 'followup_active')
            `).all();

            for (const lead of leads) {
                const daysSinceUpdate = (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                const step = lead.followup_step || 0;

                // Day 2
                if (step === 0 && daysSinceUpdate >= 2) {
                    this.sendDripEmail(lead, 1, 'Quick Check In - SmokeShop Demo', 'Hi, did you get a chance to see the demo?');
                }
                // Day 4
                else if (step === 1 && daysSinceUpdate >= 4) {
                    this.sendDripEmail(lead, 2, 'Thoughts on the website?', 'Hey, a website helps you capture local Google Maps searches. Worth a 5m chat?');
                }
                // Day 7
                else if (step === 2 && daysSinceUpdate >= 7) {
                    this.sendDripEmail(lead, 3, 'Lost your email?', 'Are you still looking to upgrade your smoke shop online presence?');
                }
                // Day 10 Breakup
                else if (step === 3 && daysSinceUpdate >= 10) {
                    this.sendDripEmail(lead, 4, 'Closing your file', 'I guess now isn\'t the best time. I will stop reaching out.');
                    // Move to closed_lost
                    db.updateLeadStage.run('closed_lost', lead.place_id);
                }
            }
        } catch (err) {
            console.error('[CRON] Drip processor error:', err.message);
        } finally {
            this.isDripping = false;
        }
    }

    sendDripEmail(lead, nextStep, subject, text) {
        if (!lead.email) return;
        console.log(`✉️ Sending Drip Email [Step ${nextStep}] to ${lead.email}: ${subject}`);
        // Log interaction and advance step
        db.db.prepare("UPDATE leads SET followup_step = ?, crm_stage = 'followup_active' WHERE place_id = ?").run(nextStep, lead.place_id);
        db.logInteraction.run(lead.place_id, 'email', `Sent Drip ${nextStep}: ${subject}`);
    }
}

module.exports = new PipelineCron();
