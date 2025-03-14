import os from "node:os";
import { MetricsTime } from "bullmq";
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
    processedCounts: {
      killmails: {
        "1min":
          Number(
            (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE)).data[0],
          ) || 0,
        "5min": (await killmailQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (await killmailQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (await killmailQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      alliances: {
        "1min":
          Number(
            (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE)).data[0],
          ) || 0,
        "5min": (await allianceQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (await allianceQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (await allianceQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      corporations: {
        "1min":
          Number(
            (await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE)).data[0],
          ) || 0,
        "5min": (await corporationQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (
          await corporationQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (
          await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (
          await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (await corporationQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      characters: {
        "1min":
          Number(
            (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE)).data[0],
          ) || 0,
        "5min": (await characterQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (await characterQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (await characterQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      characterhistory: {
        "1min":
          Number(
            (await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE))
              .data[0],
          ) || 0,
        "5min": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (
          await characterHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      corporationhistory: {
        "1min":
          Number(
            (await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE))
              .data[0],
          ) || 0,
        "5min": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (
          await corporationHistoryQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)
        ).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
      wars: {
        "1min":
          Number((await warQueue.getMetrics("completed", 0, MetricsTime.ONE_MINUTE)).data[0]) || 0,
        "5min": (await warQueue.getMetrics("completed", 0, MetricsTime.FIVE_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "15min": (await warQueue.getMetrics("completed", 0, MetricsTime.FIFTEEN_MINUTES)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1hour": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "6hours": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 6)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "12hours": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 12)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "24hours": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1week": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_HOUR * 24 * 7)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
        "1month": (await warQueue.getMetrics("completed", 0, MetricsTime.ONE_MONTH)).data
          .slice(1)
          .reduce((acc, cur) => Number(acc) + Number(cur), 0),
      },
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

function formatNumber(num: number): number {
  return Number(num.toLocaleString("da-DK")) || 0; // Lets be real, US using commas as decimal separator is just wrong.
  // When are ya'll gonne give up and use metric? plebs..
}
