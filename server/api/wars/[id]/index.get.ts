export default defineEventHandler(async (event) => {
    let warId = event.context.params?.id;
    let war = await Wars.findOne({ war_id: warId }, { _id: 0 });
    return war;
});
