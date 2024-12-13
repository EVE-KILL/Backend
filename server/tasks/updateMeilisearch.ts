import { Meilisearch } from "~/helpers/Meilisearch";
import { IAlliance } from "~/interfaces/IAlliance";
import { ICharacter } from "~/interfaces/ICharacter";
import { ICorporation } from "~/interfaces/ICorporation";
import { IFaction } from "~/interfaces/IFaction";
import { IInvType } from "~/interfaces/IInvType";
import { IRegion } from "~/interfaces/IRegion";
import { ISolarSystem } from "~/interfaces/ISolarSystem";

export default defineTask({
  meta: {
    name: "update:meilisearch",
    description: "Updates the search index in Meilisearch",
  },
  async run({ payload, context }) {
    let meilisearch = new Meilisearch();
    // Create a placeholder index
    await meilisearch.createIndex('nitro-update');

    // Get all characters, corporations, alliances, factions, systems, constellations, regionx and items
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
    }

    for (let entityType of entityTypes) {
        let entities = await getEntities(entityType);
        resultCount[entityType] = entities.length;
        await meilisearch.addDocuments('nitro-update', entities);
    }

    // Replace the nitro index with nitro-update
    await meilisearch.replaceIndex('nitro', 'nitro-update');
    await meilisearch.deleteIndex('nitro-update');

    return { result: {
        characters: { count: resultCount.characters },
        corporations: { count: resultCount.corporations },
        alliances: { count: resultCount.alliances },
        factions: { count: resultCount.factions },
        systems: { count: resultCount.systems },
        regions: { count: resultCount.regions },
        items: { count: resultCount.items },
    } };
  },
});

async function getEntities(entityType: string) {
    switch (entityType) {
        case "characters":
            let characters = await Characters.find({
                deleted: false
            });
            return characters.map((character: ICharacter) => {
                return {
                    id: character.character_id,
                    name: character.name,
                    type: 'character',
                    rank: 7
                };
            });
        case "corporations":
            let corporations = await Corporations.find({});
            return corporations.map((corporation: ICorporation) => {
                return {
                    id: corporation.corporation_id,
                    name: corporation.name,
                    ticker: corporation.ticker,
                    type: 'corporation',
                    rank: 6
                };
            });

        case "alliances":
            let alliances = await Alliances.find({});
            return alliances.map((alliance: IAlliance) => {
                return {
                    id: alliance.alliance_id,
                    name: alliance.name,
                    ticker: alliance.ticker,
                    type: 'alliance',
                    rank: 5
                };
            });

        case "factions":
            let factions = await Factions.find({});
            return factions.map((faction: IFaction) => {
                return {
                    id: faction.faction_id,
                    name: faction.name,
                    type: 'faction',
                    rank: 4
                };
            });

        case "systems":
            let systems = await SolarSystems.find({});
            return systems.map((system: ISolarSystem) => {
                return {
                    id: system.system_id,
                    name: system.system_name,
                    type: 'system',
                    rank: 3
                };
            });

        case "regions":
            let regions = await Regions.find({});
            return regions.map((region: IRegion) => {
                return {
                    id: region.region_id,
                    name: region.region_name,
                    type: 'region',
                    rank: 2
                };
            });

        case "items":
            let items = await InvTypes.find({
                published: true
            });
            return items.map((item: IInvType) => {
                return {
                    id: item.type_id,
                    name: item.type_name,
                    type: 'item',
                    rank: 1
                };
            });
    }
}
