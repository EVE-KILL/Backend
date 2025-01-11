import { createQueue } from "~/helpers/Queue";
import { addKillmail } from "~/queue/Killmail";

export default defineTask({
  meta: {
    name: "processUnprocessedKillmails",
    description: "Process Killmails that needs processing",
  },
  async run({ payload, context }) {
    // Load up the killmail queue
    let killmailQueue = createQueue("killmail");

    // If the queue has unprocessed killmails, don't add more
    let queueCount = await killmailQueue.count();
    if (queueCount > 0) {
      return {
        result: {
          foundKillmailCount: 0
        }
      }
    }

    // Limit it to 10k mails at a time
    let limit = 10000;

    let unprocessedKillmails = await KillmailsESI.aggregate([
      {
        $lookup: {
          from: "Killmails",
          localField: "killmail_id",
          foreignField: "killmail_id",
          as: "matched"
        }
      },
      {
        $match: { matched: { $eq: [] } }
      },
      { $project: { _id: 0, killmail_id: 1, killmail_hash: 1 } },
      { $limit: limit }
    ]);

    let foundKillmailCount = 0;
    for (let killmail of unprocessedKillmails) {
      foundKillmailCount++;
      addKillmail(killmail.killmail_id, killmail.killmail_hash as string, 0);
    }

    return {
      result: {
        foundKillmailCount
      }
    }
  }
});
