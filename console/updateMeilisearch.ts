import { Meilisearch } from "../server/helpers/Meilisearch";
import { IAlliance } from "../server/interfaces/IAlliance";
import { ICharacter } from "../server/interfaces/ICharacter";
import { ICorporation } from "../server/interfaces/ICorporation";
import { IFaction } from "../server/interfaces/IFaction";
import { IInvType } from "../server/interfaces/IInvType";
import { IRegion } from "../server/interfaces/IRegion";
import { ISolarSystem } from "../server/interfaces/ISolarSystem";
import { Characters } from "../server/models/Characters";
import { Corporations } from "../server/models/Corporations";
import { Alliances } from "../server/models/Alliances";
import { Factions } from "../server/models/Factions";
import { InvTypes } from "../server/models/InvTypes";
import { Regions } from "../server/models/Regions";
import { SolarSystems } from "../server/models/SolarSystems";

const BATCH_SIZE = 100000;

export default {
    name: 'update:meilisearch',
    description: 'Update the search index in Meilisearch',
    longRunning: false,
    run: async ({ args }) => {
        let meilisearch = new Meilisearch();
        // Create a placeholder index
        await meilisearch.createIndex('nitro-update');

        // Ensure the nitro index exists
        await meilisearch.createIndex('nitro');

        let entityTypes = [
            "characters",
            "corporations",
            "alliances",
            "factions",
            "systems",
            "regions",
            "items",
        ];

        let resultCount = {
            characters: 0,
            corporations: 0,
            alliances: 0,
            factions: 0,
            systems: 0,
            regions: 0,
            items: 0,
        };

        for (let entityType of entityTypes) {
            resultCount[entityType] = await processEntities(entityType, meilisearch);
        }

        // Replace the nitro index with nitro-update
        await meilisearch.replaceIndex('nitro', 'nitro-update');
        await meilisearch.deleteIndex('nitro-update');

        return { result: resultCount };
    }
};

async function processEntities(entityType: string, meilisearch: Meilisearch): Promise<number> {
    let count = 0;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const entities = await getEntities(entityType, skip, BATCH_SIZE);
        if (entities.length > 0) {
            await meilisearch.addDocuments('nitro-update', entities);
            count += entities.length;
            skip += BATCH_SIZE;
        }
        hasMore = entities.length === BATCH_SIZE;
    }

    return count;
}

async function getEntities(entityType: string, skip: number, limit: number) {
    switch (entityType) {
        case "characters":
            let characters = await Characters.find({ deleted: false }, {
                character_id: 1,
                name: 1,
            }).skip(skip).limit(limit);
            return characters.map((character: ICharacter) => ({
                id: character.character_id,
                name: character.name,
                type: 'character',
                rank: 7,
            }));

        case "corporations":
            let corporations = await Corporations.find({}, {
                corporation_id: 1,
                name: 1,
                ticker: 1,
            }).skip(skip).limit(limit);
            return corporations.map((corporation: ICorporation) => ({
                id: corporation.corporation_id,
                name: corporation.name,
                ticker: corporation.ticker,
                type: 'corporation',
                rank: 6,
            }));

        case "alliances":
            let alliances = await Alliances.find({}, {
                alliance_id: 1,
                name: 1,
                ticker: 1,
            }).skip(skip).limit(limit);
            return alliances.map((alliance: IAlliance) => ({
                id: alliance.alliance_id,
                name: alliance.name,
                ticker: alliance.ticker,
                type: 'alliance',
                rank: 5,
            }));

        case "factions":
            let factions = await Factions.find({}, {
                faction_id: 1,
                name: 1,
            }).skip(skip).limit(limit);
            return factions.map((faction: IFaction) => ({
                id: faction.faction_id,
                name: faction.name,
                type: 'faction',
                rank: 4,
            }));

        case "systems":
            let systems = await SolarSystems.find({}, {
                system_id: 1,
                system_name: 1,
            }).skip(skip).limit(limit);
            return systems.map((system: ISolarSystem) => ({
                id: system.system_id,
                name: system.system_name,
                type: 'system',
                rank: 3,
            }));

        case "regions":
            let regions = await Regions.find({}, {
                region_id: 1,
                region_name: 1,
            }).skip(skip).limit(limit);
            return regions.map((region: IRegion) => ({
                id: region.region_id,
                name: region.region_name,
                type: 'region',
                rank: 2,
            }));

        case "items":
            let items = await InvTypes.find({ published: true }, {
                type_id: 1,
                type_name: 1,
            }).skip(skip).limit(limit);
            return items.map((item: IInvType) => ({
                id: item.type_id,
                name: item.type_name,
                type: 'item',
                rank: 1,
            }));

        default:
            return [];
    }
}
