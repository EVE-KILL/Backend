import type { Job } from 'bullmq';
import { createWorker } from '../server/helpers/Queue';
import { processKillmail } from '../server/queue/Killmail';

export default {
    name: 'process:killmails',
    description: 'Processes killmails in the queue',
    run: async ({ args }) => {
        console.log('✔ Starting killmail processor');

        createWorker('killmail', async (job: Job) => {
            try {
                await processKillmail(job.data.killmailId, job.data.killmailHash);
            }
            catch (error) {
                console.log("ERROR: ", error);
            }
        }, {
            concurrency: 5
        }).on('failed', (job: Job | undefined, err: Error) => {
            console.log('Killmail Parser:', job?.id, '( KillID:', job?.data.killmailId, `) | ${err.message} | https://esi.evetech.net/latest/killmails/${job?.data.killmailId}/${job?.data.killmailHash}/`);
        }).on('completed', (job: Job) => {
            console.log('Killmail Parser:', job.id, '( KillID:', job.data.killmailId, ') | Completed');
        });
    }
};
