import { createQueue } from "~/helpers/Queue";

export default defineEventHandler(async (event) => {
    const allianceQueue = createQueue('alliance');
    const corporationQueue = createQueue('corporation');
    const characterQueue = createQueue('character');
    const characterHistoryQueue = createQueue('characterhistory');
    const corporationHistoryQueue = createQueue('corporationhistory');
    const killmailQueue = createQueue('killmail');
    const warQueue = createQueue('war');

    return {
        queueCounts: {
            alliance: await allianceQueue.getJobCounts(),
            corporation: await corporationQueue.getJobCounts(),
            character: await characterQueue.getJobCounts(),
            characterhistory: await characterHistoryQueue.getJobCounts(),
            corporationhistory: await corporationHistoryQueue.getJobCounts(),
            killmail: await killmailQueue.getJobCounts(),
            war: await warQueue.getJobCounts()
        },
        allianceCount: await Alliances.estimatedDocumentCount(),
        corporationCount: await Corporations.estimatedDocumentCount(),
        characterCount: await Characters.estimatedDocumentCount(),
        killmailCount: await Killmails.estimatedDocumentCount(),
        esiKillmailCount: await KillmailsESI.estimatedDocumentCount(),
        warCount: await Wars.estimatedDocumentCount()
    }
});
