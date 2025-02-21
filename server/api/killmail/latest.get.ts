import { Killmails } from "../../models/Killmails";
import { IKillmail } from "../../interfaces/IKillmail";

export default defineEventHandler(async () => {
  const latestKillmails: IKillmail[] = await Killmails.find(
    {},
    {
      _id: 0,
      killmail_id: 1,
      killmail_hash: 1
    },
    {
      sort: { createdAt: -1 },
      limit: 10000,
    },
  ).hint('createdAt_-1');

  // Return { killmail_id: killmail_hash, ... }
  let killmails: { [key: string]: string } = {};
  latestKillmails.forEach((killmail) => {
    killmails[killmail.killmail_id] = killmail.killmail_hash;
  });

  return killmails;

});
