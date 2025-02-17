import fs from 'fs';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { Alliances } from "../server/models/Alliances";
import { Corporations } from "../server/models/Corporations";
import { Characters } from "../server/models/Characters";

export default {
    name: 'import:data',
    description: 'Import the data dump from doomlord',
    longRunning: false,
    run: async ({ args }) => {
        // Files
        let alliancesFile = require('../data/alliances.json');
        let corporationsFile = require('../data/corporations.json');

        // Stream and parse the 8GB characters.json file using stream-json
        const fileStream = fs.createReadStream('./data/characters.json');
        const pipeline = chain([
            fileStream,
            parser(),
            streamArray()
        ]);

        // Process the stream using async iteration
        for await (const { value: character } of pipeline) {
            let characterData = new Characters({
                character_id: character.character_id,
                name: character.name,
                description: character.description,
                birthday: character.birthday,
                gender: character.gender,
                race_id: character.race_id,
                security_status: character.security_status,
                bloodline_id: character.bloodline_id,
                corporation_id: character.corporation_id,
                alliance_id: character.alliance_id || 0,
                faction_id: character.faction_id || 0,
                history: character.history || [],
                deleted: character.deleted || false
            });

            console.log(`Character: ${character.name}`);
            try {
                await characterData.save();
            } catch (err) {
                await characterData.updateOne({ character_id: character.character_id }, {
                    name: character.name,
                    description: character.description,
                    birthday: character.birthday,
                    gender: character.gender,
                    race_id: character.race_id,
                    security_status: character.security_status,
                    bloodline_id: character.bloodline_id,
                    corporation_id: character.corporation_id,
                    alliance_id: character.alliance_id || 0,
                    faction_id: character.faction_id || 0,
                    history: character.history || [],
                    deleted: character.deleted || false
                });
            }
        }

        // Extract the arrays from the JSON structure
        const alliances = alliancesFile.alliances || alliancesFile;
        const corporations = corporationsFile.corporations || corporationsFile;

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
        }

        return { response: 'Success' };
    }
};
