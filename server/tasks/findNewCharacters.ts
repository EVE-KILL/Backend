import { getCharacter } from "../helpers/ESIData";
import { Characters } from '../models/Characters';

export default defineTask({
    meta: {
        name: "update:affiliations",
        description: "Updates the affiliations of cgaracters",
    },
    async run({ payload, context }) {
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
                return { result: `Too many errors, stopping` };
            }

            let characterData = await getCharacter(characterId, true);
            if (characterData.error) {
                errorCount++;
            }

            if (characterData.character_id) {
                newCharacters++;
            }
        }

        return { result: `Found ${newCharacters} new characters` };
    },
});
