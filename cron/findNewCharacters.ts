import { getCharacter } from "../server/helpers/ESIData";
import { Characters } from '../server/models/Characters';
import { cliLogger } from '../server/helpers/Logger';

export default {
    name: "findNewCharacters",
    description: "Find new characters",
    schedule: "*/5 * * * *",
    run: async ({ args }) => {
        // Find the highest character_id in the database
        let highestCharacterId = 0;
        let highestCharacter = await Characters.findOne().sort({ character_id: -1 });
        if (highestCharacter) {
            highestCharacterId = highestCharacter.character_id;
        }

        // Invent some new character IDs, take the highest ID and add 10
        let maxCharacterId = highestCharacterId + 10;
        // Then generate all the IDs between highestCharacterId and maxCharacterId
        let newCharacterIds = [];
        for (let i = highestCharacterId + 1; i <= maxCharacterId; i++) {
            newCharacterIds.push(i);
        }

        let errorCount = 0;
        let newCharacters = 0;

        // Try and fetch the characters
        for (let characterId of newCharacterIds) {
            if (errorCount > 2) {
                return cliLogger.error(`Too many errors, stopping`);
            }

            let characterData = await getCharacter(characterId, true);
            if (characterData.error) {
                errorCount++;
            }

            if (characterData.character_id) {
                newCharacters++;
            }
        }

        if (process.env.BACKEND_DISCORD_URL !== undefined && newCharacters > 0) {
            await fetch(process.env.BACKEND_DISCORD_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: `Found ${newCharacters} new characters`,
                }),
            });
        }

        return cliLogger.info(`Found ${newCharacters} new characters`);
    },
};
