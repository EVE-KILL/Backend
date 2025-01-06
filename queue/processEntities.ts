import type { Job } from 'bullmq';
import { createWorker } from '../server/helpers/Queue';
import { updateCharacter } from '../server/queue/Character';
import { updateCorporation } from '../server/queue/Corporation';
import { updateAlliance } from '../server/queue/Alliance';

export default {
    name: 'process:entities',
    description: 'Process updates for characters, corporations and alliances',
    run: ({ args }) => {
        console.log('✔ Starting entity processor');

        createWorker('character', async (job: Job) => {
            await updateCharacter(job.data.characterId);
        }, {
            concurrency: 5
        }).on('failed', (job: Job | undefined, err: Error) => {
            console.log('Character Update:', job?.id, '( CharacterID:', job?.data.characterId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}/'}/latest/characters/${job?.data.characterId}/`);
        }).on('completed', (job: Job) => {
            console.log('Character Update:', job.id, '( CharacterID:', job.data.characterId, ') | Completed');
        });

        createWorker('corporation', async (job: Job) => {
            await updateCorporation(job.data.corporationId);
        }, {
            concurrency: 5
        }).on('failed', (job: Job | undefined, err: Error) => {
            console.log('Corporation Update:', job?.id, '( CorporationID:', job?.data.corporationId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}/'}/latest/corporations/${job?.data.corporationId}/`);
        }).on('completed', (job: Job) => {
            console.log('Corporation Update:', job.id, '( CorporationID:', job.data.corporationId, ') | Completed');
        });

        createWorker('alliance', async (job: Job) => {
            await updateAlliance(job.data.allianceId);
        }, {
            concurrency: 5
        }).on('failed', (job: Job | undefined, err: Error) => {
            console.log('Alliance Update:', job?.id, '( AllianceID:', job?.data.allianceId, `) | ${err.message} | ${process.env.ESI_URL || 'https://esi.evetech.net/'}/'}/latest/alliances/${job?.data.allianceId}/`);
        }).on('completed', (job: Job) => {
            console.log('Alliance Update:', job.id, '( AllianceID:', job.data.allianceId, ') | Completed');
        });
    }
};
