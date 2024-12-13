import { queueUpdateCorporation } from "../server/queue/Corporation";
import { queueUpdateCharacter } from "../server/queue/Character";
import { queueUpdateAlliance } from "../server/queue/Alliance";
import { Characters } from "../server/models/Characters";

export default {
    name: 'importfromek',
    description: 'Import stuff from eve-kill',
    longRunning: false,
    run: async ({ args }) => {
        const BATCH_SIZE = 1000;

        async function fetchAndProcess(url: string, queueFunction: Function, checkExisting: boolean = false) {
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(`${url}/page/${page}`);
                const data: number[] = await response.json();

                for (const id of data) {
                    if (checkExisting) {
                        const exists = await Characters.exists({ character_id: id });
                        if (exists) continue;
                    }

                    console.log(`Queueing ID: ${id}`);
                    await queueFunction(id, 10);
                }

                if (data.length < BATCH_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                }
            }
        }

        // Process characters
        await fetchAndProcess(
            'https://eve-kill.com/api/characters',
            queueUpdateCharacter,
            true // Check for existing characters in the database
        );

        // Process corporations
        await fetchAndProcess(
            'https://eve-kill.com/api/corporations',
            queueUpdateCorporation
        );

        // Process alliances
        await fetchAndProcess(
            'https://eve-kill.com/api/alliances',
            queueUpdateAlliance
        );
    }
};
