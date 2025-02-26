import { RedisStorage } from "../server/helpers/Storage";
import { cliLogger } from "../server/helpers/Logger";

export default {
  name: "tqStatus",
  description: "Check the status of the TQ server",
  schedule: "* * * * *",
  run: async () => {
    cliLogger.info("Checking TQ status...");
    const request = await fetch(
      `${process.env.ESI_URL || "https://esi.evetech.net/"}/latest/status/?datasource=tranquility`,
    );
    const status = await request.json();
    const storage = new RedisStorage();

    if (status.error) {
      // TQ is throwing errors, lets pause the fetcher for 5 minutes
      await storage.set("tqStatus", "offline");
      await storage.set("fetcher_paused", Date.now() + 300000);
    } else {
      switch (request.status) {
        case 503:
          // TQ is offline
          await storage.set("tqStatus", "offline");
          // Pause the fetcher until current time + 5 minutes
          await storage.set("fetcher_paused", Date.now() + 300000);
          break;

        default:
          // TQ is online
          await storage.set("tqStatus", "online");
          await storage.del("fetcher_paused");
          break;
      }
    }

    return cliLogger.info(`TQ Status: ${status.players} players`);
  },
};
