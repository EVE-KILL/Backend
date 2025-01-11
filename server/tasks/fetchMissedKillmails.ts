import { addKillmail } from "~/queue/Killmail";

export default defineTask({
  meta: {
    name: "fetchMissedKillmails",
    description: "Fetch missed killmails by poking zKillboard history API",
  },
  async run({ payload, context }) {
    let zkbHistoryTotals = 'https://zkillboard.com/api/history/totals.json';
    let response = await fetch(zkbHistoryTotals);
    let data = await response.json();
    let foundKillmailCount = 0;

    // Get data for the last 7 days (Times in the totals.json is listed as: "YYYYMMDD": count
    // Reverse the array so we get the most recent days first
    let days = Object.entries(data).reverse().slice(0, 7);

    // For each day in the history, get the killmails
    for (let [date, count] of days) {
      let zkbHistory = `https://zkillboard.com/api/history/${date}.json`;
      let response = await fetch(zkbHistory);
      let data = await response.json();

      let existingKillmails = await KillmailsESI.find({ killmail_id: { $in: Object.keys(data) } }, { killmail_id: 1 }).lean();
      let existingIds = new Set(existingKillmails.map(k => k.killmail_id));
      let missingKillmails = Object.entries(data).filter(([killmail_id, killmail_hash]) => !existingIds.has(Number(killmail_id)));

      // Data is a list of killmails for the day, listed as: { "killmail_id": "killmail_hash", ... }
      for (let [killmail_id, killmail_hash] of missingKillmails) {
        let exists = await KillmailsESI.exists({ killmail_id: killmail_id });
        if (!exists) {
          foundKillmailCount++;
          addKillmail(Number(killmail_id), killmail_hash as string, 0);
        }
      }
    }

    if (process.env.BACKEND_DISCORD_URL !== undefined && foundKillmailCount > 0) {
        await fetch(process.env.BACKEND_DISCORD_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: `Found ${foundKillmailCount} missing killmails`,
            }),
        });
    }

    return { result: {
      'foundKillmailCount': foundKillmailCount
    } }
  }
});
