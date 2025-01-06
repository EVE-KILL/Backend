export default defineEventHandler(async (event) => {
    let query = getQuery(event);
    let page = query?.page ? parseInt(query.page as string) : 1;
    let wars = (await Wars.find(
        {},
        {war_id: 1},
        { limit: 100000, skip: (page - 1) * 100000 }
    )).map(war => war.war_id);

    return wars;
});
