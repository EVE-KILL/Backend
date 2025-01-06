import type { Job } from 'bullmq';
import { determineRoutingKeys } from '~/helpers/DetermineRoutingKeys';
import { createWorker } from '~/helpers/Queue';
import { broadcastKillmail } from '~/helpers/WSClientManager';
import { processKillmail } from '~/queue/Killmail';

export default defineNitroPlugin(() => {
    let enabled = process.env.QUEUES_ENABLED === 'true';
    if (!enabled) {
        console.log('ℹ️  Killmail processor is disabled');
        return;
    }

    console.log('✔ Starting killmail processor');

    createWorker('killmail', async (job: Job) => {
        try {
            let killmail = await processKillmail(job.data.killmailId, job.data.killmailHash, job.data.warId || 0);
            let routingKeys = determineRoutingKeys(killmail);
            broadcastKillmail(killmail, routingKeys);
        }
        catch (error) {
            console.log("ERROR: ", error);
        }
    }, {
        concurrency: 2
    }).on('failed', (job: Job | undefined, err: Error) => {
        console.log('Killmail Parser:', job?.id, '( KillID:', job?.data.killmailId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/killmails/${job?.data.killmailId}/${job?.data.killmailHash}/`);
    }).on('completed', (job: Job) => {
        console.log('Killmail Parser:', job.id, '( KillID:', job.data.killmailId, ') | Completed');
    });
});
