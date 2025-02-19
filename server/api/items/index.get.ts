export default defineEventHandler(async (event) => {
    return InvTypes.find({published: true}, {
        _id: 0,
        type_id: 1,
        type_name: 1,
        group_id: 1
    });
});
