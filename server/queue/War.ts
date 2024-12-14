import { getWar } from '../helpers/ESIData';
import { createQueue } from '../helpers/Queue';

const warQueue = createQueue('war');

async function queueUpdateWar(warId: number, priority: number = 1) {
    await warQueue.add(
        'war',
        { warId: warId },
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

async function updateWar(warId: number) {
    return await getWar(warId);
}

export { queueUpdateWar, updateWar };
