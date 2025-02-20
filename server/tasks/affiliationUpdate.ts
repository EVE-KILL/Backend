import _ from "lodash";
import { processChunk } from "~/helpers/Affiliation";
import { createQueue } from "~/helpers/Queue";

export default defineTask({
    meta: {
        name: "update:affiliations",
        description: "Updates the affiliations of characters",
    },
    async run({ payload, context }) {
        // If the queue isn't empty, we don't want to run this task
        let queue = createQueue("character");
        let queueCount = await queue.getJobCounts();

        if (queueCount.waiting > 0 || queueCount.active > 0 || queueCount.prioritized > 0) {
            return {
                result: {
                    queued: 0,
                    reason: "Queue has data",
                },
            };
        }

        let limit = 10000; // Get up to 10000 characters at a time, this means we send 10 requests to ESI

        /**
         * We need to limit the amount of characters we update at any one time.
         * To do this we have the updatedAt and last_active fields on the character document.
         * Using these we should follow these rules:
         * 1. If the character has been active in the last 30 days - we update them daily
         * 2. If the character has been active in the last 60 days - we update them every 3 days
         * 3. If the character has been active in the last 90 days - we update them weekly
         * 4. If the character has been active in the last 180 days - we update them every two weeks
         * 5. Beyond that the character is updated monthly
         */

        let queries = [
            // 30 days
            {
                last_active: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
                updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            },
            // 60 days
            {
                last_active: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) },
                updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
            },
            // 90 days
            {
                last_active: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) },
                updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
            },
            // 180 days
            {
                last_active: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) },
                updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) },
            },
            // 365 days
            {
                last_active: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365) },
                updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
            },
        ];

        let characters = [];
        for (let query of queries) {
            let chunk = await Characters.find(
                {
                    deleted: { $ne: true },
                    ...query,
                },
                {
                    _id: 0,
                    character_id: 1,
                    corporation_id: 1,
                    alliance_id: 1,
                },
                {
                    limit: limit,
                }
            );

            for (let character of chunk) {
                characters.push(character);
            }
        }

        // We can only fetch upwards of 1000 characters at a time, so we have to spluit the characters into chunks
        let characterChunks = _.chunk(characters, 1000);
        let queuedCount = 0;

        // For each character chunk we fetch the character data
        for (let chunk of characterChunks) {
            let count = 0;
            count = await processChunk(chunk);
            queuedCount += count;
        }

        if (process.env.BACKEND_DISCORD_URL !== undefined && queuedCount > 0) {
            await fetch(process.env.BACKEND_DISCORD_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: `Queued ${queuedCount} characters for affiliation update`,
                }),
            });
        }

        return {
            result: {
                queued: queuedCount,
            },
        };
    },
});
