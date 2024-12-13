import { Killmails } from "../../models/Killmails";
import { IKillmail } from "../../interfaces/IKillmail";

export default defineEventHandler(async () => {
  const latestKillmails: IKillmail[] = await Killmails.find(
    {},
    {
      _id: 0,
      killmail_id: 1,
      hash: 1,
    },
    {
      sort: { createdAt: -1 },
      limit: 10000,
    },
  );

  return latestKillmails.map((km) => km.killmail_id);
});
