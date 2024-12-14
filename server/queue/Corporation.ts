import { getCorporation } from '../helpers/ESIData';
import { createQueue } from '../helpers/Queue';

const corporationQueue = createQueue('corporation');

async function queueUpdateCorporation(corporationId: number, priority: number = 1) {
    await corporationQueue.add(
        'corporation',
        { corporationId: corporationId },
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

async function updateCorporation(corporationId: number) {
    await getCorporation(corporationId, true);
}

export { queueUpdateCorporation, updateCorporation };
