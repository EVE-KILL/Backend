import { ICharacter } from '~/interfaces/ICharacter';
import { Killmails } from '../models/Killmails';
import { ICorporation } from '~/interfaces/ICorporation';
import { IAlliance } from '~/interfaces/IAlliance';
import { ISolarSystem } from '~/interfaces/ISolarSystem';
import { IInvType } from '~/interfaces/IInvType';
import { IRegion } from '~/interfaces/IRegion';
import { IConstellation } from '~/interfaces/IConstellation';

// Earliest known killmail is from 2007-12-05
const timeSinceEarlyDays: Date = new Date('2007-12-05T00:00:00Z');

async function topCharacters(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "attackers.character_id": { $ne: 0 },
        "kill_time": { $gte: calculatedTime },
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    character_id: "$attackers.character_id",
                    killmail_id: "$killmail_id",
                }
            }
        },
        {
            $group: {
                _id: "$_id.character_id",
                count: { $sum: 1 },
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const results = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(results.map(async (character: any) => {
        const data: ICharacter | null = await Characters.findOne({ character_id: character.id });
        return {
            character_id: character.id,
            name: data?.name || "Unknown",
            count: character.count
        };
    }));

    return mappedResults;
}

async function topCorporations(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "attackers.corporation_id": { $ne: 0 },
        "kill_time": { $gte: calculatedTime }
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    corporation_id: "$attackers.corporation_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.corporation_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const results = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(results.map(async (corporation: any) => {
        const data: ICorporation | null = await Corporations.findOne({ corporation_id: corporation.id });
        return {
            corporation_id: corporation.id,
            name: data?.name || "Unknown",
            count: corporation.count
        };
    }));

    return mappedResults;
}

async function topAlliances(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "attackers.alliance_id": { $ne: 0 },
        "kill_time": { $gte: calculatedTime }
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    alliance_id: "$attackers.alliance_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.alliance_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const result = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(result.map(async (alliance: any) => {
        const data: IAlliance | null = await Alliances.findOne({ alliance_id: alliance.id });
        return {
            alliance_id: alliance.id,
            name: data?.name || "Unknown",
            count: alliance.count
        };
    }));

    return mappedResults;
}

async function topSystems(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = { "kill_time": { $gte: calculatedTime } };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    system_id: "$system_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.system_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const result = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(result.map(async (system: any) => {
        const data: ISolarSystem | null = await SolarSystems.findOne({ system_id: system.id });
        return {
            system_id: system.id,
            name: data?.system_name || "Unknown",
            count: system.count
        };
    }));

    return mappedResults;
}

async function topConstellations(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = new Date('2007-12-05T00:00:00Z'); // timeSinceEarlyDays
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "kill_time": { $gte: calculatedTime },
        "constellation_id": { $ne: null }
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    constellation_id: "$constellation_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.constellation_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const result = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(result.map(async (constellation: any) => {
        const data: IConstellation | null = await Constellations.findOne({ constellation_id: constellation.id });
        return {
            constellation_id: constellation.id,
            name: data?.constellation_name || "Unknown",
            count: constellation.count
        };
    }));

    return mappedResults;
}

async function topRegions(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = { "kill_time": { $gte: calculatedTime } };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        {
            $group: {
                _id: {
                    region_id: "$region_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.region_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const result = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(result.map(async (region: any) => {
        const data: IRegion | null = await Regions.findOne({ region_id: region.id });
        return {
            region_id: data?.region_id || 0,
            name: data?.region_name || "Unknown",
            count: region.count
        };
    }));

    return mappedResults;
}

async function topShips(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "kill_time": { $gte: calculatedTime },
        "attackers.ship_id": { $nin: [0, 670] }
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        { $match: { "attackers.ship_id": { $nin: [0, 670] } } },
        {
            $group: {
                _id: {
                    ship_id: "$attackers.ship_id",
                    killmail_id: "$killmail_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.ship_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    const result = await Killmails.aggregate(query, { allowDiskUse: true });

    const mappedResults = await Promise.all(result.map(async (ship: any) => {
        const data: IInvType | null = await InvTypes.findOne({ type_id: ship.id });
        return {
            type_id: ship.id,
            name: data?.type_name || "Unknown",
            count: ship.count
        };
    }));

    return mappedResults;
}

async function topSolo(
    attackerType: string | null = null,
    typeId: number | null = null,
    days: number | null = 30,
    limit: number = 10
) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const matchFilter: any = {
        "is_solo": true,
        "kill_time": { $gte: calculatedTime }
    };
    if (attackerType && typeId) {
        matchFilter[`attackers.${attackerType}`] = typeId;
    }

    const query: any[] = [
        { $match: matchFilter },
        { $unwind: "$attackers" },
        { $match: { "attackers.final_blow": true } },
        {
            $group: {
                _id: "$attackers.character_id",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$count",
                id: "$_id"
            }
        },
        { $sort: { count: -1, id: 1 } },
        { $limit: limit }
    ];

    return await Killmails.aggregate(query, { allowDiskUse: true });
}

async function mostValuableKills(days: number | null = 7, limit: number = 10) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const query: any[] = [
        {
            $match: {
                "kill_time": { $gte: calculatedTime }
            }
        },
        { $project: { _id: 0 } },
        { $sort: { "total_value": -1 }},
        { $limit: limit }
    ];

    return (await Killmails.aggregate(query, { allowDiskUse: true })).map((killmail: any) => {
        return {
            killmail_id: killmail.killmail_id,
            total_value: killmail.total_value,
            victim: {
                ship_id: killmail.victim.ship_id,
                ship_name: killmail.victim.ship_name,
            }
        }
    });
}

async function mostValuableStructures(days: number | null = 7, limit: number = 10) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }
    const structureGroupIDs = [1657, 1406, 1404, 1408, 2017, 2016];

    const query: any[] = [
        {
            $match: {
                "kill_time": { $gte: calculatedTime },
                "victim.ship_group_id": { $in: structureGroupIDs }
            }
        },
        { $project: { _id: 0 }},
        { $sort: { "total_value": -1 } },
        { $limit: limit }
    ];

    return (await Killmails.aggregate(query, { allowDiskUse: true })).map((killmail: any) => {
        return {
            killmail_id: killmail.killmail_id,
            total_value: killmail.total_value,
            victim: {
                ship_id: killmail.victim.ship_id,
                ship_name: killmail.victim.ship_name,
            }
        }
    });
}

async function mostValuableShips(days: number | null = 7, limit: number = 10) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const shipGroupIDs = [
        547,485,513,902,941,30,659,419,27,29,26,420,25,28,463,237,31,
        324,898,906,540,830,893,543,541,833,358,894,831,832,900,834,380,963,1305
    ];

    const query: any[] = [
        {
            $match: {
                "kill_time": { $gte: calculatedTime },
                "victim.ship_group_id": { $in: shipGroupIDs }
            }
        },
        { $project: { _id: 0 }},
        { $sort: { "total_value": -1 } },
        { $limit: limit }
    ];

    return (await Killmails.aggregate(query, { allowDiskUse: true })).map((killmail: any) => {
        return {
            killmail_id: killmail.killmail_id,
            total_value: killmail.total_value,
            victim: {
                ship_id: killmail.victim.ship_id,
                ship_name: killmail.victim.ship_name,
            }
        }
    });
}

async function killCount(days: number | null = 7) {
    let calculatedTime = timeSinceEarlyDays;
    if (days) {
        calculatedTime = new Date(Date.now() - (days * 86400 * 1000));
    }

    const query: any[] = [
        { $match: { kill_time: { $gte: calculatedTime } } },
        { $count: "count" }
    ];

    return await Killmails.aggregate(query, { allowDiskUse: true });
}

async function newCharacters() {
    const thresholdDate = new Date('2003-01-01T00:00:00Z');

    const query: any[] = [
        {
            $match: {
                "birthday": { $gte: thresholdDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$birthday" },
                    month: { $month: "$birthday" },
                    day: { $dayOfMonth: "$birthday" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ];

    return await Characters.aggregate(query, { allowDiskUse: true });
}

export {
    topCharacters,
    topCorporations,
    topAlliances,
    topSystems,
    topConstellations,
    topRegions,
    topShips,
    topSolo,
    mostValuableKills,
    mostValuableStructures,
    mostValuableShips,
    killCount,
    newCharacters
};
