import type { Job } from 'bullmq';
import { createWorker } from '../server/helpers/Queue';
import { updateWar } from '../server/queue/War';
import { getWarKillmails } from '../server/helpers/ESIData';
import { addKillmail } from '../server/queue/Killmail';


export default {
    name: 'process:wars',
    description: 'Process the queued wars',
    run: ({ args }) => {
        console.log('✔ Starting war processor');

        createWorker('war', async (job: Job) => {
            let warData = await updateWar(job.data.warId);
            // If the war isn't over, and aggressor or defender isk_destroyed is not zero - we need to queue up the killmails for processing
            //if (!warData.finished && (warData.aggressor.ships_killed > 0 || warData.defender.ships_killed > 0)) {
            if (warData.aggressor.ships_killed > 0 || warData.defender.ships_killed > 0) {
                console.log('War Update:', job.id, '( WarID:', job.data.warId, ') | Processing Killmails');
                // Queue up the killmails for processing
                let killmails = await getWarKillmails(job.data.warId);
                for (let killmail of killmails) {
                    await addKillmail(killmail.killmail_id, killmail.killmail_hash, job.data.warId, 100);
                }
            }

            // Sleep for a random amount of time, between 100ms and 1000ms
            let sleepTime = Math.floor(Math.random() * 900) + 100;
            //console.log('War Update:', job.id, '( WarID:', job.data.warId, ') | Sleeping for', sleepTime, 'ms');
            await new Promise(resolve => setTimeout(resolve, sleepTime));
        }, {
            concurrency: 1
        }).on('failed', (job: Job | undefined, err: Error) => {
            console.log('War Update:', job?.id, '( WarID:', job?.data.warId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/wars/${job?.data.warId}/`);
        }).on('completed', (job: Job) => {
            console.log('War Update:', job.id, '( WarID:', job.data.warId, ') | Completed');
        });
    }
};
