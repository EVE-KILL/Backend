import { calculateFullStats } from "~/helpers/Stats";

export default defineEventHandler(async (event) => {
    const characterId: number | null = event.context.params?.id ? parseInt(event.context.params.id) : null;
    const query = getQuery(event);
    const days: number = query?.days ? parseInt(query.days as string) : 0;
    if (!characterId) {
        return { error: "Character ID not provided" };
    }

    return calculateFullStats('character_id', characterId, days);
});
