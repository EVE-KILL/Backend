import { createQueue } from "~/helpers/Queue";
import { customPriceCache } from "~/helpers/Prices";
import {
    solarSystemsCache,
    regionsCache,
    invGroupsCache,
    nearCache,
    constellationsCache,
    itemsCache,
    priceCache,
    characterCache,
    corporationCache,
    allianceCache,
    factionCache
} from "~/helpers/KillmailParser";

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
            alliance: await allianceQueue.count(),
            corporation: await corporationQueue.count(),
            character: await characterQueue.count(),
            characterhistory: await characterHistoryQueue.count(),
            corporationhistory: await corporationHistoryQueue.count(),
            killmail: await killmailQueue.count(),
            war: await warQueue.count()
        },
        allianceCount: await Alliances.estimatedDocumentCount(),
        corporationCount: await Corporations.estimatedDocumentCount(),
        characterCount: await Characters.estimatedDocumentCount(),
        killmailCount: await Killmails.estimatedDocumentCount(),
        esiKillmailCount: await KillmailsESI.estimatedDocumentCount(),
        warCount: await Wars.estimatedDocumentCount(),
        // Added cache sizes
        cacheSizes: {
            solarSystemsCache: solarSystemsCache.size,
            regionsCache: regionsCache.size,
            invGroupsCache: invGroupsCache.size,
            nearCache: nearCache.size,
            constellationsCache: constellationsCache.size,
            itemsCache: itemsCache.size,
            priceCache: priceCache.size,
            characterCache: characterCache.size,
            corporationCache: corporationCache.size,
            allianceCache: allianceCache.size,
            factionCache: factionCache.size,
            customPriceCache: customPriceCache.size,
        }
    }
});
