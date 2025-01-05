export default defineEventHandler(async (event) => {
    let wars = (await Wars.find({}, {war_id: 1})).map(war => war.war_id);

    return wars;
});
