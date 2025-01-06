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
        let oldESIKillmails = oldESIKillmailModel.find({}, {}).lean().cursor();
        const batchSize = 10000;
        let batch = [];
        let count = 0;

        for await (let killmail of oldESIKillmails) {
            let oldDoc = killmail;
            delete oldDoc._id;

            let existingESIKillmail = await KillmailsESI.findOne({ killmail_id: oldDoc.killmail_id });
            if (existingESIKillmail) {
                continue;
            }

            batch.push(oldDoc);
            count++;

            if (batch.length >= batchSize) {
                console.log(`Importing batch of ${batch.length} killmails (Total: ${count})`);
                await KillmailsESI.insertMany(batch, { ordered: false });
                batch = [];
            }
        }

        // Insert remaining documents
        if (batch.length > 0) {
            console.log(`Importing final batch of ${batch.length} killmails (Total: ${count})`);
            await KillmailsESI.insertMany(batch, { ordered: false });
        }
    }
};
