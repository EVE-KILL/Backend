import { createQueue } from "~/helpers/Queue";
import {
    solarSystemsCache,
    regionsCache,
    nearCache,
    constellationsCache,
    customPriceCache,
    invGroupsCache,
    invTypesCache,
    invFlagsCache,
    factionsCache,
    priceCache,
    characterCache,
    corporationCache,
    allianceCache,
    cacheHits
} from "~/helpers/RuntimeCache";

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
        // Updated cache sizes using maps and LRU caches
        cacheSizes: {
            solarSystemsCache: solarSystemsCache.size,
            regionsCache: regionsCache.size,
            nearCache: nearCache.size,
            constellationsCache: constellationsCache.size,
            customPriceCache: customPriceCache.size,
            invGroupsCache: invGroupsCache.size,
            invFlagsCache: invFlagsCache.size,
            invTypesCache: invTypesCache.size,
            factionsCache: factionsCache.size,
            priceCache: priceCache.size,
            characterCache: characterCache.size,
            corporationCache: corporationCache.size,
            allianceCache: allianceCache.size
        },
        cacheHits
    };
});
