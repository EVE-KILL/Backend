import { fetchESIKillmail } from "../../helpers/ESIData";
import { parseKillmail } from "../../helpers/KillmailParser";
import { processKillmail } from "../../queue/Killmail";
import { IESIKillmail } from "../../interfaces/IESIKillmail";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const killmailId = Number(query.killmail_id as number);
  const killmailHash = query.killmail_hash as string;

  let killmail: IESIKillmail = await fetchESIKillmail(killmailId, killmailHash);
  await processKillmail(killmailId, killmailHash);

  let parsed = await parseKillmail(killmail);

  return parsed;
});
