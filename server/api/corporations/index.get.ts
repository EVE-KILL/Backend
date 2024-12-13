import { defineEventHandler } from 'h3';
import { ICorporation } from '../../interfaces/ICorporation';

export default defineEventHandler(async (event) => {
    let corporations: ICorporation[] = await Corporations.find({}, { corporation_id: 1 });
    // Return a single array containing all the IDs
    return corporations.map((corporation) => corporation.corporation_id);
});
