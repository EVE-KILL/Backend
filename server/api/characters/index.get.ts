import { defineEventHandler } from 'h3';
import { ICharacter } from '../../interfaces/ICharacter';

export default defineEventHandler(async (event) => {
    let query = getQuery(event);
    let page = query?.page ? parseInt(query.page as string) : 1;
    let characters: ICharacter[] = await Characters.find({}, { character_id: 1 }, { limit: 100000, skip: (page - 1) * 100000 });

    // Return a single array containing all the IDs
    return characters.map((character) => character.character_id);
});
