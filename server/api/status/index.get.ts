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
import os from "os";

const startTime = new Date();
export default defineEventHandler(async (event) => {
    const allianceQueue = createQueue('alliance');
    const corporationQueue = createQueue('corporation');
    const characterQueue = createQueue('character');
    const characterHistoryQueue = createQueue('characterhistory');
    const corporationHistoryQueue = createQueue('corporationhistory');
    const killmailQueue = createQueue('killmail');
    const warQueue = createQueue('war');

    const [
        allianceQueueCount,
        corporationQueueCount,
        characterQueueCount,
        characterHistoryQueueCount,
        corporationHistoryQueueCount,
        killmailQueueCount,
        warQueueCount,
        allianceCount,
        celestialCount,
        characterCount,
        commentCount,
        constellationCount,
        customPriceCount,
        factionCount,
        invFlagCount,
        invGroupCount,
        invTypeCount,
        killmailCount,
        esiKillmailCount,
        priceCount,
        regionCount,
        solarSystemsCount,
        userCount,
        warCount
    ] = await Promise.all([
        allianceQueue.count(),
        corporationQueue.count(),
        characterQueue.count(),
        characterHistoryQueue.count(),
        corporationHistoryQueue.count(),
        killmailQueue.count(),
        warQueue.count(),
        Alliances.estimatedDocumentCount(),
        Celestials.estimatedDocumentCount(),
        Characters.estimatedDocumentCount(),
        Comments.estimatedDocumentCount(),
        Constellations.estimatedDocumentCount(),
        CustomPrices.estimatedDocumentCount(),
        Factions.estimatedDocumentCount(),
        InvFlags.estimatedDocumentCount(),
        InvGroups.estimatedDocumentCount(),
        InvTypes.estimatedDocumentCount(),
        Killmails.estimatedDocumentCount(),
        KillmailsESI.estimatedDocumentCount(),
        Prices.estimatedDocumentCount(),
        Regions.estimatedDocumentCount(),
        SolarSystems.estimatedDocumentCount(),
        Users.estimatedDocumentCount(),
        Wars.estimatedDocumentCount(),
    ]);

    return {
        uptime: Math.floor(process.uptime()),
        upSince: startTime,
        localTime: new Date(),
        env: {
            nodeEnv: process.env.NODE_ENV,
            nodeVersion: process.version,
            processName: process.title
        },
        operatingSystem: {
            systemPlatform: process.platform,
            systemArch: process.arch,
            loadAvg: os.loadavg().map((avg) => avg.toFixed(2)),
            totalCPUs: os.cpus().length,
            totalMemoryGB: Math.floor(os.totalmem() / 1024 / 1024 / 1024),
        },
        queueCounts: {
            alliance: allianceQueueCount,
            corporation: corporationQueueCount,
            character: characterQueueCount,
            characterhistory: characterHistoryQueueCount,
            corporationhistory: corporationHistoryQueueCount,
            killmail: killmailQueueCount,
            war: warQueueCount
        },
        databaseCounts: {
            alliances: formatNumber(allianceCount),
            celestial: formatNumber(celestialCount),
            characters: formatNumber(characterCount),
            comments: formatNumber(commentCount),
            constellations: formatNumber(constellationCount),
            customPrices: formatNumber(customPriceCount),
            factions: formatNumber(factionCount),
            invFlags: formatNumber(invFlagCount),
            invGroups: formatNumber(invGroupCount),
            invTypes: formatNumber(invTypeCount),
            killmails: formatNumber(killmailCount),
            esiKillmails: formatNumber(esiKillmailCount),
            prices: formatNumber(priceCount),
            regions: formatNumber(regionCount),
            solarSystems: formatNumber(solarSystemsCount),
            users: formatNumber(userCount),
            wars: formatNumber(warCount)
        },
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

function formatNumber(num: number) {
    return num.toLocaleString('da-DK'); // Lets be real, US using commas as decimal separator is just wrong.
    // When are ya'll gonne give up and use metric? plebs..
}
