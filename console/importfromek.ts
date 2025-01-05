import { queueUpdateCorporation } from "../server/queue/Corporation";
import { queueUpdateAlliance } from "../server/queue/Alliance";
import mongoose from 'mongoose';
import { Characters } from '../server/models/Characters';

export default {
    name: 'importfromek',
    description: 'Import stuff from eve-kill',
    longRunning: false,
    run: async ({ args }) => {
        async function fetchAndProcess(url: string, type: string, queueFunction: Function) {
            const response = await fetch(url);
            const data: number[] = await response.json();

            for (const id of data) {
                console.log(`Queueing (${type}) ID: ${id}`);
                await queueFunction(id, 10);
            }
        }

        // Process alliances
        await fetchAndProcess(
            'https://eve-kill.com/api/alliances',
            'alliance',
            queueUpdateAlliance
        );

        // Process corporations
        await fetchAndProcess(
            'https://eve-kill.com/api/corporations',
            'corporation',
            queueUpdateCorporation
        );

        // Create a connection to the old database
        let conn = mongoose.createConnection('mongodb://192.168.10.10:30017/app');
        // Create a placeholder model for the old database
        let oldCharacterModel = conn.model('characters', new mongoose.Schema({}, { strict: false }));

        // For each character in the old database, insert it into the new database
        let oldCharacters = oldCharacterModel.find().lean().cursor();

        for await (let character of oldCharacters) {
            // First we need to check if the character we are trying to import already exists in the new database
            let existingCharacter = await Characters.findOne({ character_id: character.character_id });

            // If the character already exists, we skip it
            if (existingCharacter) {
                continue;
            }

            if (character.name === 'Deleted' || character.name === 'Unknown' || character.name === "") {
                continue;
            }

            let mappedToCharacter = new Characters(character);
            console.log(`Importing character ${mappedToCharacter.name}`);
            await mappedToCharacter.save();
        }
    }
};
