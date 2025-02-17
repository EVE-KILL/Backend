import { KillmailsESI } from "../server/models/KillmailsESI";
import { createQueue } from "../server/helpers/Queue";

export default {
    name: 'backfill:killmailsfromzkb',
    description: 'Use the zKillboard history endpoint to backfill missing killmails in the ESI database',
    longRunning: false,
    run: async ({ args }) => {
        let zkbHistoryTotals = 'https://zkillboard.com/api/history/totals.json';

        let response = await fetch(zkbHistoryTotals);
        let data = await response.json();

        const killmailQueue = createQueue('killmail');

        // For each day in the history, get the killmails
        for (let [date, count] of Object.entries(data).reverse()) {
            // Skip ahead to 20230506
            //if (date < '20241215') {
            //    continue;
            //}
            console.log(`Getting killmails for ${date}`);
            let zkbHistory = `https://zkillboard.com/api/history/${date}.json`;
            let response = await fetch(zkbHistory);
            let data = await response.json();

            let existingKillmails = await KillmailsESI.find({ killmail_id: { $in: Object.keys(data) } }, { killmail_id: 1 }).lean();
            let existingIds = new Set(existingKillmails.map(k => k.killmail_id));
            let missingKillmails = Object.entries(data).filter(([killmail_id, killmail_hash]) => !existingIds.has(Number(killmail_id)));

            console.log(`Found ${missingKillmails.length} missing killmails for ${date}`);
            killmailQueue.addBulk(missingKillmails.map(([killmail_id, killmail_hash]) => ({
                name: 'processKillmail',
                data: { killmailId: Number(killmail_id), killmailHash: killmail_hash as string },
                opts: { priority: 100 },
            })));

            console.log(`Queued ${missingKillmails.length} killmails for ${date}`);

            // Sleep to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
};
