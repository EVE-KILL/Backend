import os from "node:os";
import { createQueue } from "~/helpers/Queue";
import {
  allianceCache,
  cacheHits,
  characterCache,
  constellationsCache,
  corporationCache,
  customPriceCache,
  factionsCache,
  invFlagsCache,
  invGroupsCache,
  invTypesCache,
  nearCache,
  priceCache,
  regionsCache,
  solarSystemsCache,
} from "~/helpers/RuntimeCache";

const startTime = new Date();
export default defineEventHandler(async () => {
  const allianceQueue = createQueue("alliance");
  const corporationQueue = createQueue("corporation");
  const characterQueue = createQueue("character");
  const characterHistoryQueue = createQueue("characterhistory");
  const corporationHistoryQueue = createQueue("corporationhistory");
  const killmailQueue = createQueue("killmail");
  const warQueue = createQueue("war");

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
    warCount,
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

  // Format cacheHits with formatNumber
  const formattedCacheHits = Object.fromEntries(
    Object.entries(cacheHits).map(([key, value]) => [key, formatNumber(value)]),
  );

  return {
    uptime: Math.floor(process.uptime()),
    upSince: startTime,
    localTime: new Date(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      processName: process.title,
    },
    operatingSystem: {
      systemPlatform: process.platform,
      systemArch: process.arch,
      loadAvg: os.loadavg().map((avg) => avg.toFixed(2)),
      totalCPUs: formatNumber(os.cpus().length),
      totalMemoryGB: formatNumber(Math.floor(os.totalmem() / 1024 / 1024 / 1024)),
    },
    queueCounts: {
      alliance: formatNumber(allianceQueueCount),
      corporation: formatNumber(corporationQueueCount),
      character: formatNumber(characterQueueCount),
      characterhistory: formatNumber(characterHistoryQueueCount),
      corporationhistory: formatNumber(corporationHistoryQueueCount),
      killmail: formatNumber(killmailQueueCount),
      war: formatNumber(warQueueCount),
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
      unprocessedCount: formatNumber(esiKillmailCount - killmailCount),
      prices: formatNumber(priceCount),
      regions: formatNumber(regionCount),
      solarSystems: formatNumber(solarSystemsCount),
      users: formatNumber(userCount),
      wars: formatNumber(warCount),
    },
    cacheSizes: {
      solarSystemsCache: formatNumber(solarSystemsCache.size),
      regionsCache: formatNumber(regionsCache.size),
      nearCache: formatNumber(nearCache.size),
      constellationsCache: formatNumber(constellationsCache.size),
      customPriceCache: formatNumber(customPriceCache.size),
      invGroupsCache: formatNumber(invGroupsCache.size),
      invFlagsCache: formatNumber(invFlagsCache.size),
      invTypesCache: formatNumber(invTypesCache.size),
      factionsCache: formatNumber(factionsCache.size),
      priceCache: formatNumber(priceCache.size),
      characterCache: formatNumber(characterCache.size),
      corporationCache: formatNumber(corporationCache.size),
      allianceCache: formatNumber(allianceCache.size),
    },
    cacheHits: {
      ...formattedCacheHits,
    },
  };
});

function formatNumber(num: number) {
  return num.toLocaleString("da-DK"); // Lets be real, US using commas as decimal separator is just wrong.
  // When are ya'll gonne give up and use metric? plebs..
}
