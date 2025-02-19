import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
    let count: Number = await InvTypes.estimatedDocumentCount();
    return { count: count };
});
