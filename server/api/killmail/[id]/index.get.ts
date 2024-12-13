import { Killmails } from "../../../models/Killmails";
import { IKillmail } from "../../../interfaces/IKillmail";

export default defineEventHandler(async (event) => {
  const killmail_id = event.context.params?.id;
  const killmail: IKillmail | null = await Killmails.findOne(
    { killmail_id: killmail_id },
    { _id: 0 },
  );

  return killmail || { error: "Killmail not found" };
});
