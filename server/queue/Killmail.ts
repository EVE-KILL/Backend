import { fetchESIKillmail } from '../helpers/ESIData';
import { parseKillmail } from '../helpers/KillmailParser';
import { createQueue } from '../helpers/Queue';
import { Killmails } from '../models/Killmails';

const killmailQueue = createQueue('killmail');

async function addKillmail(killmailId: number, killmailHash: string, priority: number = 1) {
    await killmailQueue.add(
        'killmail',
        { killmailId: killmailId, killmailHash: killmailHash },
        {
            priority: priority,
            attempts: 10,
            backoff: {
                type: 'fixed',
                delay: 5000 // 5 minutes
            },
            removeOnComplete: true,
        }
    );
}

async function processKillmail(killmailId: number, killmailHash: string) {
    let killmail = await fetchESIKillmail(killmailId, killmailHash);

    if (killmail.error || !killmail.victim) {
        throw new Error(`Error fetching killmail: ${killmail.error}`);
    }

    let processedKillmail = await parseKillmail(killmail);
    let model = new Killmails(processedKillmail);
    try {
        await model.save();

        // Her laves nu et POST kald til internal endpoint
        const internalAuthKey = process.env.INTERNAL_AUTH_KEY; // Sæt denne i .env
        if (!internalAuthKey) {
            throw new Error('No internal auth key configured in ENV');
        }

        // @TODO fix this url so it matches eve-kill's proper url in the future..
        await fetch('http://localhost:3000/api/ws/submit-killmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${internalAuthKey}`
            },
            body: JSON.stringify({
                killmail: processedKillmail
            })
        });
    } catch (error) {
        await Killmails.updateOne({ killmail_id: killmailId }, processedKillmail);
    }
}

export { addKillmail, processKillmail, fetchESIKillmail };
