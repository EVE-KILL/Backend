import { defineEventHandler } from 'h3';
import { IFaction } from '../../interfaces/IFaction';

export default defineEventHandler(async (event) => {
    let factions: IFaction[] = await Factions.find({}, { faction_id: 1 });
    // Return a single array containing all the IDs
    return factions.map((faction) => faction.faction_id);
});
