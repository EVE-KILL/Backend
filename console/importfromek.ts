//import { queueUpdateCorporation } from "../server/queue/Corporation";
//import { queueUpdateAlliance } from "../server/queue/Alliance";
import mongoose from 'mongoose';
//import { Characters } from '../server/models/Characters';
//import { Corporations } from '../server/models/Corporations';
//import { Alliances } from '../server/models/Alliances';
import { KillmailsESI } from '../server/models/KillmailsESI';

export default {
    name: 'importfromek',
    description: 'Import stuff from eve-kill',
    longRunning: false,
    run: async ({ args }) => {
         // Create a connection to the old database
        let conn = mongoose.createConnection('mongodb://192.168.10.10:30017/app');
        // Create a placeholder model for the old database
        //let oldCharacterModel = conn.model('characters', new mongoose.Schema({}, { strict: false }));
        //let oldCorporationModel = conn.model('corporations', new mongoose.Schema({}, { strict: false }));
        //let oldAllianceModel = conn.model('alliances', new mongoose.Schema({}, { strict: false }));
        let oldESIKillmailModel = conn.model(
            "KillmailsESI",
            new mongoose.Schema({}, { strict: false, collection: "killmails_esi" })
        );

        // For each character in the old database, insert it into the new database
        //let oldCharacters = oldCharacterModel.find().lean().cursor();

        // for await (let character of oldCharacters) {
        //     // First we need to check if the character we are trying to import already exists in the new database
        //     let existingCharacter = await Characters.findOne({ character_id: character.character_id });

        //     // If the character already exists, we skip it
        //     if (existingCharacter) {
        //         continue;
        //     }

        //     if (character.name === 'Deleted' || character.name === 'Unknown' || character.name === "") {
        //         continue;
        //     }

        //     let mappedToCharacter = new Characters(character);
        //     console.log(`Importing character ${mappedToCharacter.name}`);
        //     await mappedToCharacter.save();
        // }

        // For each corporation in the old database, insert it into the new database
        // let oldCorporations = oldCorporationModel.find().lean().cursor();

        // for await (let corporation of oldCorporations) {
        //     let existingCorporation = await Corporations.findOne({ corporation_id: corporation.corporation_id });

        //     if (existingCorporation) {
        //         continue;
        //     }

        //     let mappedToCorporation = new Corporations(corporation);
        //     console.log(`Importing corporation ${mappedToCorporation.name}`);
        //     await mappedToCorporation.save();

        //     // Queue the corporation for updating
        //     queueUpdateCorporation(corporation.corporation_id);
        // }

        // // For each alliance in the old database, insert it into the new database
        // let oldAlliances = oldAllianceModel.find().lean().cursor();

        // for await (let alliance of oldAlliances) {
        //     let existingAlliance = await Alliances.findOne({ alliance_id: alliance.alliance_id });

        //     if (existingAlliance) {
        //         continue;
        //     }

        //     let mappedToAlliance = new Alliances(alliance);
        //     console.log(`Importing alliance ${mappedToAlliance.name}`);
        //     await mappedToAlliance.save();

        //     // Queue the alliance for updating
        //     queueUpdateAlliance(alliance.alliance_id);
        // }

        // Killmails
        let totalImported = 0;
        let count = 56;
        const fetchSize = 1000000;

        // Loop until there isn't 1 million results coming from oldIds
        while (true) {
            console.log(`Fetching chunk ${count + 1} with ${fetchSize} killmails.`);
            const oldIds = (await oldESIKillmailModel.find(
                {},
                { killmail_id: 1 },
                { limit: fetchSize, skip: fetchSize * count, sort: { killmail_id: 1 } }
            )).map(km => km.killmail_id);

            if (oldIds.length === 0) {
                break;
            }

            // Fetch existing from KillmailsESI only for these oldIds
            const existingInNewDB = await KillmailsESI.find(
                { killmail_id: { $in: oldIds } },
                { killmail_id: 1 }
            );
            const existingSet = new Set(existingInNewDB.map(k => k.killmail_id));

            const missingIds = oldIds.filter(id => !existingSet.has(id));

            const chunkSize = 100000;
            for (let i = 0; i < missingIds.length; i += chunkSize) {
                const chunk = missingIds.slice(i, i + chunkSize);
                const oldKillmails = await oldESIKillmailModel.find({ killmail_id: { $in: chunk } }).lean();

                const ops = oldKillmails.map(km => ({
                    updateOne: {
                        filter: { killmail_id: km.killmail_id },
                        update: { $setOnInsert: km },
                        upsert: true
                    }
                }));

                await KillmailsESI.bulkWrite(ops, { ordered: false });
                totalImported += ops.length;
                console.log(`Imported chunk ${(i / chunkSize) + 1} with ${ops.length} killmails.`);
            }

            count++;
        }

        console.log(`Completed import for ${totalImported} killmails.`);
    }
};
