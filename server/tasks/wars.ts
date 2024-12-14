import { esiFetcher } from "~/helpers/ESIFetcher";
import { queueUpdateWar } from "~/queue/War";

export default defineTask({
  meta: {
    name: "wars",
    description: "Fetch a list of all war IDs from ESI",
  },
  async run({ payload, context }) {
    let latestWarId = (await Wars.findOne({}, {}, { sort: { war_id: -1 } }))?.war_id ?? 999999999;
    console.log(`Starting war ID fetching process from war_id: ${latestWarId}`);

    let hasMoreWars = true;
    const allWarIds: number[] = [];

    while (hasMoreWars) {
      const wars: number[] = await getWars(latestWarId);
      console.log(`ℹ️  Fetched ${wars.length} wars with latestWarId: ${latestWarId}`);

      if (wars.length === 0) {
        hasMoreWars = false;
      }

      // Get the smallest war ID from the fetched wars and set it to latestWarId
      latestWarId = Math.min(...wars);

      // Queue up the war IDs for processing
      for (let warId of wars) {
        queueUpdateWar(warId);
      }
    }

    console.log(`✅ Finished fetching wars. Total war IDs fetched: ${allWarIds.length}`);

    return { result: { totalWarIds: allWarIds } }; // Return the list of all war IDs
  },
});

async function getWars(latestWarId: number) {
  const wars = await esiFetcher(`https://esi.evetech.net/latest/wars/?max_war_id=${latestWarId}&datasource=tranquility`);
  return wars;
}
