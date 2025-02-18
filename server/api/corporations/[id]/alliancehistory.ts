import { getCorporation } from "../../../helpers/ESIData";
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
    const corporationId: number | null = event.context.params?.id ? parseInt(event.context.params.id) : null;
    if (!corporationId) {
        return { error: "Corporation ID not provided" };
    }

    const corporation = await getCorporation(corporationId);
    let history = corporation.history.reverse() ?? null;
    if (history === null) {
        return { error: "Corporation history not found" };
    }

    // Create a map of the history of a corporation, calculating when the corporation joined and left an alliance.
    // Each record has a start_date, so we can calculate the end_date by looking at the next record.
    history = history.map((corp, index) => {
        let nextRecord = history[index + 1];
        return {
            record_id: corp.record_id,
            alliance_id: corp.alliance_id,
            start_date: corp.start_date,
            end_date: nextRecord ? nextRecord.start_date : null,
        }
    });

    let result = history.map(async (corp) => {
        let allianceInfo = null;
        if (corp.alliance_id) {
            allianceInfo = await Alliances.findOne({ alliance_id: corp.alliance_id });
        }

        return {
            record_id: corp.record_id,
            alliance_id: corp.alliance_id || 0,
            alliance_name: allianceInfo?.name || "",
            start_date: corp.start_date,
            end_date: corp.end_date,
        }
    });

    return (await Promise.all(result)).reverse();
});
