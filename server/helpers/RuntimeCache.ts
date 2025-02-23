import { InvGroups } from "../models/InvGroups";
import { InvTypes } from "../models/InvTypes";
import { InvFlags } from "../models/InvFlags";
import { Factions } from "../models/Factions";
import { Regions } from "../models/Regions";
import { Constellations } from "../models/Constellations";
import { SolarSystems } from "../models/SolarSystems";
import { CustomPrices } from "../models/CustomPrices";
import { ICustomPrice } from "~/interfaces/ICustomPrice";
import { LRUCache } from "lru-cache";
import { getCharacter, getCorporation, getAlliance } from "./ESIData";
import { getPrice } from "./Prices";
import { ISolarSystem } from "~/interfaces/ISolarSystem";
import { IConstellation } from "~/interfaces/IConstellation";
import { IRegion } from "~/interfaces/IRegion";
import { IFaction } from "~/interfaces/IFaction";
import { IInvType } from "~/interfaces/IInvType";
import { IInvFlag } from "~/interfaces/IInvFlag";
import { IInvGroup } from "~/interfaces/IInvGroup";
import { ICharacter } from "~/interfaces/ICharacter";
import { ICorporation } from "~/interfaces/ICorporation";
import { IAlliance } from "~/interfaces/IAlliance";

export const invGroupsCache = new Map<number, IInvGroup>();
export const invTypesCache = new Map<number, IInvType>();
export const invFlagsCache = new Map<number, IInvFlag>();
export const factionsCache = new Map<number, IFaction>();
export const regionsCache = new Map<number, IRegion>();
export const constellationsCache = new Map<number, IConstellation>();
export const solarSystemsCache = new Map<number, ISolarSystem>();
export const customPriceCache = new Map<number, ICustomPrice>();
export const priceCache = new LRUCache<string, number>({ max: 1000000, ttl: 1000 * 60 * 60 * 24, allowStale: true });
export const characterCache = new LRUCache<string, ICharacter>({ max: 100000, ttl: 1000 * 60 * 60 * 6, allowStale: true });
export const corporationCache = new LRUCache<string, ICorporation>({ max: 100000, ttl: 1000 * 60 * 60 * 6, allowStale: true });
export const allianceCache = new LRUCache<string, IAlliance>({ max: 100000, ttl: 1000 * 60 * 60 * 6, allowStale: true });
export const nearCache = new LRUCache<string, any>({ max: 10000, ttl: 1000 * 60 * 60 * 1, allowStale: true });

async function loadAllInvGroups(): Promise<void> {
	const groups = await InvGroups.find({});
	for (const group of groups) {
		invGroupsCache.set(group.group_id, group);
	}
}
async function loadAllInvTypes(): Promise<void> {
	const types = await InvTypes.find({});
	for (const type of types) {
		invTypesCache.set(type.type_id, type);
	}
}
async function loadAllInvFlags(): Promise<void> {
    const flags = await InvFlags.find({});
    for (const flag of flags) {
        invFlagsCache.set(flag.flag_id, flag);
    }
}
async function loadAllFactions(): Promise<void> {
	const factions = await Factions.find({});
	for (const faction of factions) {
		factionsCache.set(faction.faction_id, faction);
	}
}
async function loadAllRegions(): Promise<void> {
	const regions = await Regions.find({});
	for (const region of regions) {
		regionsCache.set(region.region_id, region);
	}
}
async function loadAllConstellations(): Promise<void> {
	const constellations = await Constellations.find({});
	for (const constellation of constellations) {
		constellationsCache.set(constellation.constellation_id, constellation);
	}
}
async function loadAllSolarSystems(): Promise<void> {
	const solarSystems = await SolarSystems.find({});
	for (const solarSystem of solarSystems) {
		solarSystemsCache.set(solarSystem.system_id, solarSystem);
	}
}
async function loadAllCustomPrices(): Promise<void> {
	const prices = await CustomPrices.find({}).sort({ date: 1 });
	for (const price of prices) {
		customPriceCache.set(price.type_id, price);
	}
}

// Load at startup.
await Promise.all([
	loadAllInvGroups(),
	loadAllInvTypes(),
	loadAllInvFlags(),
	loadAllFactions(),
	loadAllRegions(),
	loadAllConstellations(),
	loadAllSolarSystems(),
	loadAllCustomPrices()
]);
console.log(`ℹ️  Runtime caches loaded`,
	`invGroups: ${invGroupsCache.size}`,
	`invTypes: ${invTypesCache.size}`,
	`invFlags: ${invFlagsCache.size}`,
	`factions: ${factionsCache.size}`,
	`regions: ${regionsCache.size}`,
	`constellations: ${constellationsCache.size}`,
	`solarSystems: ${solarSystemsCache.size}`,
	`customPrices: ${customPriceCache.size}`
)

setInterval(loadAllInvGroups, 1000 * 60 * 60);
setInterval(loadAllInvTypes, 1000 * 60 * 60);
setInterval(loadAllInvFlags, 1000 * 60 * 60);
setInterval(loadAllFactions, 1000 * 60 * 60);
setInterval(loadAllRegions, 1000 * 60 * 60);
setInterval(loadAllConstellations, 1000 * 60 * 60);
setInterval(loadAllSolarSystems, 1000 * 60 * 60);
setInterval(loadAllCustomPrices, 1000 * 60 * 60);

export async function getCachedInvGroup(groupId: number): Promise<any> {
	if (invGroupsCache.has(groupId)) return invGroupsCache.get(groupId);
	const group = await InvGroups.findOne({ group_id: groupId });
	if (group) invGroupsCache.set(groupId, group);
	return group;
}

export async function getCachedItem(typeId: number): Promise<any> {
	if (invTypesCache.has(typeId)) return invTypesCache.get(typeId);
	const type = await InvTypes.findOne({ type_id: typeId });
	if (type) invTypesCache.set(typeId, type);
	return type;
}

export async function getCachedInvFlag(flagId: number): Promise<any> {
	if (invFlagsCache.has(flagId)) return invFlagsCache.get(flagId);
	const flag = await InvFlags.findOne({ flag_id: flagId });
	if (flag) invFlagsCache.set(flagId, flag);
	return flag;
}

export async function getCachedFaction(factionId: number): Promise<any> {
	if (factionsCache.has(factionId)) return factionsCache.get(factionId);
	const faction = await Factions.findOne({ faction_id: factionId });
	if (faction) factionsCache.set(factionId, faction);
	return faction;
}

export async function getCachedRegion(regionId: number): Promise<any> {
	if (regionsCache.has(regionId)) return regionsCache.get(regionId);
	const region = await Regions.findOne({ region_id: regionId });
	if (region) regionsCache.set(regionId, region);
	return region;
}

export async function getCachedConstellation(constellationId: number): Promise<any> {
	if (constellationsCache.has(constellationId)) return constellationsCache.get(constellationId);
	const constellation = await Constellations.findOne({ constellation_id: constellationId });
	if (constellation) constellationsCache.set(constellationId, constellation);
	return constellation;
}

export async function getCachedSolarSystem(solarSystemId: number): Promise<any> {
	if (solarSystemsCache.has(solarSystemId)) return solarSystemsCache.get(solarSystemId);
	const solarSystem = await SolarSystems.findOne({ solar_system_id: solarSystemId });
	if (solarSystem) solarSystemsCache.set(solarSystemId, solarSystem);
	return solarSystem;
}

export async function getCachedCharacter(characterId: number): Promise<any> {
    const key = String(characterId);
    if (characterCache.has(key)) return characterCache.get(key);
    const character = await getCharacter(characterId);
    if (character) characterCache.set(key, character);
    return character;
}

export async function getCachedCorporation(corporationId: number): Promise<any> {
    const key = String(corporationId);
    if (corporationCache.has(key)) return corporationCache.get(key);
    const corp = await getCorporation(corporationId);
    if (corp) corporationCache.set(key, corp);
    return corp;
}

export async function getCachedAlliance(allianceId: number): Promise<any> {
    const key = String(allianceId);
    if (allianceCache.has(key)) return allianceCache.get(key);
    const alliance = await getAlliance(allianceId);
    if (alliance) allianceCache.set(key, alliance);
    return alliance;
}

export async function getCachedPrice(typeId: number, killTime: Date): Promise<number> {
	const key = `${typeId}-${killTime.getTime()}`;
	if (priceCache.has(key)) return priceCache.get(key);
	const price = await getPrice(typeId, killTime);
	if (price) priceCache.set(key, price);
	return price;
}
