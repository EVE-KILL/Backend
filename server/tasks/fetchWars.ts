import { esiFetcher } from "~/helpers/ESIFetcher";
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

      console.log(existingWar, warId);
      //queueUpdateWar(warId);
      newWars++;
    }

    return { result: { newWars: newWars } }; // Return the list of all war IDs
  },
});

async function getLatestWars() {
  const wars = await esiFetcher(`https://esi.evetech.net/latest/wars/`);
  return wars;
}
