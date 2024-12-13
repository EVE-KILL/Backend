import { getAlliance } from '../helpers/ESIData';
import { createQueue } from '../helpers/Queue';

const allianceQueue = createQueue('alliance');

async function queueUpdateAlliance(allianceId: number, priority: number = 1) {
    await allianceQueue.add(
        'alliance',
        { allianceId: allianceId },
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

async function updateAlliance(allianceId: number) {
    await getAlliance(allianceId, true);
}

export { queueUpdateAlliance, updateAlliance };