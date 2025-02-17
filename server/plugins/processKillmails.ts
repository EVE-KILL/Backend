import type { Job } from 'bullmq';
import { determineRoutingKeys } from '~/helpers/DetermineRoutingKeys';
import { createWorker } from '~/helpers/Queue';
import { broadcastKillmail } from '~/helpers/WSClientManager';
import { processKillmail } from '~/queue/Killmail';

export default defineNitroPlugin(() => {
    if (process.env.PROCESS_KILLMAILS !== 'true') {
        console.log('✘ Skipping killmail processor');
        return;
    }

    console.log('✔ Starting killmail processor');

    createWorker('killmail', async (job: Job) => {
        try {
            if (job.data.killmailId && job.data.killmailHash) {
                console.log('Processing killmail:', job.data.killmailId, '-', job.data.killmailHash, 'WarID:', job.data.warId || 0, 'Priority', job.opts.priority);
                let killmail = await processKillmail(job.data.killmailId, job.data.killmailHash, job.data.warId || 0);
                let routingKeys = determineRoutingKeys(killmail);
                broadcastKillmail(killmail, routingKeys);
            }
        }
        catch (error) {
            console.log(job.data);
            console.log("ERROR: ", error);
        }
    }, {
        concurrency: 10
    }).on('failed', (job: Job | undefined, err: Error) => {
        console.log('Killmail Parser:', job?.id, '( KillID:', job?.data.killmailId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/killmails/${job?.data.killmailId}/${job?.data.killmailHash}/`);
    });
});
