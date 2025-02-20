import { queueUpdateWar } from "~/queue/War";

export default defineTask({
  meta: {
    name: "updateWars",
    description: "Fetch a list of all war IDs from ESI",
  },
  async run({ payload, context }) {
    if (process.env.NODE_ENV === 'development') {
      return {};
    }

    let activeWars = await Wars.find({ finished: false });
    console.log(`ℹ️  Found ${activeWars.length} active wars`);

    for (let war of activeWars) {
      queueUpdateWar(war.war_id);
    }

    return { result: { totalWarIds: activeWars.map(war => war.war_id) } };
  },
});
