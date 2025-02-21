import { IKillmail } from '../interfaces/IKillmail';
import { fetchESIKillmail } from '../helpers/ESIData';
import { parseKillmail } from '../helpers/KillmailParser';
import { createQueue } from '../helpers/Queue';
import { Killmails } from '../models/Killmails';

const killmailQueue = createQueue('killmail');

async function addKillmail(killmailId: number, killmailHash: string, warId: number = 0, priority: number = 1) {
    await killmailQueue.add(
        'killmail',
        { killmailId: killmailId, killmailHash: killmailHash, warId: warId },
        {
            priority: priority,
            attempts: 10,
            backoff: {
                type: 'fixed',
                delay: 5000 // 5 seconds
            },
            removeOnComplete: true,
        }
    );
}

async function processKillmail(killmailId: number, killmailHash: string, warId: number = 0): Promise<Partial<IKillmail>> {
    let killmail = await fetchESIKillmail(killmailId, killmailHash);

    if (killmail.error || !killmail.victim) {
        throw new Error(`Error fetching killmail: ${killmail.error}`);
    }

    let processedKillmail = await parseKillmail(killmail, warId);
    let model = new Killmails(processedKillmail);
    try {
        await model.save();

        // Her laves nu et POST kald til internal endpoint
        const internalAuthKey = process.env.INTERNAL_AUTH_KEY; // Sæt denne i .env
        if (!internalAuthKey) {
            throw new Error('No internal auth key configured in ENV');
        }

    } catch (error) {
        await Killmails.updateOne({ killmail_id: killmailId }, processedKillmail);
    }

    return processedKillmail;
}

export { addKillmail, processKillmail, fetchESIKillmail };
