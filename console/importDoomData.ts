import { Alliances } from "../server/models/Alliances";
import { queueUpdateAlliance } from "../server/queue/Alliance";
import { Corporations } from "../server/models/Corporations";
import { queueUpdateCorporation } from "../server/queue/Corporation";

export default {
    name: 'import:doomdata',
    description: 'Import the data dump from doomlord',
    longRunning: false,
    run: async ({ args }) => {
        // Files
        let alliancesFile = require('../data/alliances_202501042042.json');
        let corporationsFile = require('../data/corporations_202501042042.json');

        // Extract the arrays from the JSON structure
        const alliances = alliancesFile.alliances;
        const corporations = corporationsFile.corporations;

        // Import alliances
        console.log(`Processing ${alliances.length} alliances`);
        for (let alliance of alliances) {
            let allianceData = new Alliances({
                alliance_id: alliance.id,
                name: alliance.name,
                ticker: alliance.ticker,
                executor_corporation_id: alliance.executor_corporation_id || 0,
                creator_id: alliance.creator_character_id || 0,
                date_founded: new Date(alliance.date_founded),
            });

            console.log(`Alliance: ${alliance.name} (${alliance.ticker})`);
            try {
                await allianceData.save();
            } catch (err) {
                await allianceData.updateOne({ alliance_id: alliance.id }, {
                    name: alliance.name,
                    ticker: alliance.ticker,
                    executor_corporation_id: alliance.executor_corporation_id || 0,
                    creator_id: alliance.creator_character_id || 0,
                    date_founded: new Date(alliance.date_founded),
                });
            }
            await queueUpdateAlliance(alliance.id);
        }

        // Import corporations
        console.log(`Processing ${corporations.length} corporations`);
        for (let corporation of corporations) {
            let corporationData = new Corporations({
                corporation_id: corporation.id,
                name: corporation.name,
                ticker: corporation.ticker,
                date_founded: new Date(corporation.date_founded),
                creator_id: corporation.creator_character_id || 0,
                ceo_id: corporation.ceo_character_id || 0,
                member_count: corporation.member_count,
            });

            console.log(`Corporation: ${corporation.name} (${corporation.ticker})`);
            try {
                await corporationData.save();
            } catch (err) {
                await corporationData.updateOne({ corporation_id: corporation.id }, {
                    corporation_id: corporation.id,
                    name: corporation.name,
                    ticker: corporation.ticker,
                    date_founded: new Date(corporation.date_founded),
                    creator_id: corporation.creator_character_id || 0,
                    ceo_id: corporation.ceo_character_id || 0,
                    member_count: corporation.member_count,
                });
            }
            await queueUpdateCorporation(corporation.id);
        }

        return { response: 'Success' };
    }
};
