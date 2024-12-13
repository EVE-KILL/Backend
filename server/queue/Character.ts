import { getCharacter } from '../helpers/ESIData';
import { createQueue } from '../helpers/Queue';

const characterQueue = createQueue('character');

async function queueUpdateCharacter(characterId: number, priority: number = 1) {
    await characterQueue.add(
        'character',
        { characterId: characterId },
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

async function updateCharacter(characterId: number) {
    await getCharacter(characterId, true);
}

export { queueUpdateCharacter, updateCharacter };
