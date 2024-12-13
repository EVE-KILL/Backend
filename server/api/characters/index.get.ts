import { defineEventHandler } from 'h3';
import { ICharacter } from '../../interfaces/ICharacter';

export default defineEventHandler(async (event) => {
    let characters: ICharacter[] = await Characters.find({}, { character_id: 1 });
    // Return a single array containing all the IDs
    return characters.map((character) => character.character_id);
});
