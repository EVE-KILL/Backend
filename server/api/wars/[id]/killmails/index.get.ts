export default defineEventHandler(async (event) => {
    let warId = event.context.params?.id;
    let killmails = (await Killmails.find({ war_id: warId }, { killmail_id: 1, killmail_hash: 1 })).map(killmail => {
        return {
            killmail_id: killmail.killmail_id,
            killmail_hash: killmail.killmail_hash,
        };
    });

    return killmails;
});
