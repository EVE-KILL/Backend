import { RedisStorage } from "~/helpers/Storage";

export default defineTask({
  meta: {
    name: "tq",
    description: "Update the status of tranquility",
  },
  async run({ payload, context }) {
    let request = await fetch(`${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/status/?datasource=tranquility`);
    let status = await request.json();

    const storage = new RedisStorage();

    if (status.error) {
      // TQ is throwing errors, lets pause the fetcher for 120 seconds
      await storage.set('tqStatus', 'offline');
      await storage.set('fetcher_paused', Date.now() + 120000);
    }

    switch (status.status) {
        case "503":
            // TQ is offline
            await storage.set('tqStatus', 'offline');
            // Pause the fetcher until current time + 60seconds
            await storage.set('fetcher_paused', Date.now() + 120000);
            break;

        case undefined:
            // TQ is offline
            await storage.set('tqStatus', 'offline');
            await storage.set('fetcher_paused', Date.now() + 120000);
            break

        default:
            // TQ is online
            await storage.set('tqStatus', 'online');
            await storage.del('fetcher_paused');
            break;
    }

    return { result: {
      tqStatus: status.status || 'offline',
      tqPlayers: status.players || 0,
      tqStartTime: status.start_time || 0,
      tqServerVersion: status.server_version || 'unknown',
    } }
  }
});
