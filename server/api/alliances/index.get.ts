import { defineEventHandler } from 'h3';
import { IAlliance } from '../../interfaces/IAlliance';

export default defineEventHandler(async (event) => {
    let alliances: IAlliance[] = await Alliances.find({}, { alliance_id: 1 });
    // Return a single array containing all the IDs
    return alliances.map((alliance) => alliance.alliance_id);
});
