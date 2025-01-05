import { defineEventHandler } from 'h3';
import { ICorporation } from '../../interfaces/ICorporation';

export default defineEventHandler(async (event) => {
    let query = getQuery(event);
    let page = query?.page ? parseInt(query.page as string) : 1;
    let corporations: ICorporation[] = await Corporations.find({}, { corporation_id: 1 }, { limit: 100000, skip: (page - 1) * 100000 });
    // Return a single array containing all the IDs
    return corporations.map((corporation) => corporation.corporation_id);
});
