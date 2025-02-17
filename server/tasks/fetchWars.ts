import { esiFetcher } from "~/helpers/ESIFetcher";
import { queueUpdateWar } from "~/queue/War";
import { IWar } from "~/interfaces/IWar";

export default defineTask({
  meta: {
    name: "fetchWars",
    description: "Fetch new wars from the ESI",
  },
  async run({ payload, context }) {
    const wars: number[] = await getLatestWars();
    let newWars = 0;
    for (let warId of wars) {
      let existingWar: IWar | null = await Wars.findOne({ war_id: warId });
      if (existingWar) {
        continue;
      }

      queueUpdateWar(warId);
      newWars++;
    }

    if (process.env.BACKEND_DISCORD_URL !== undefined && newWars > 0) {
        await fetch(process.env.BACKEND_DISCORD_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: `Found ${newWars} new wars`,
            }),
        });
    }

    return { result: { newWars: newWars } }; // Return the list of all war IDs
  },
});

async function getLatestWars() {
  const wars = await esiFetcher(`${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/wars/`);
  return wars;
}
