import { IESIAttacker, IESIKillmail, IESIVictim, IESIVictimItem } from "../interfaces/IESIKillmail";
import { IAttacker, IItem, IKillmail, IVictim } from "../interfaces/IKillmail";
import { getCharacter, getCorporation, getAlliance, getFaction, getItem } from "./ESIData";
import { getPrice } from "./Prices";
import { SolarSystems } from "../models/SolarSystems";
import { Regions } from "../models/Regions";
import { Celestials } from "../models/Celestials";
import { InvGroups } from "../models/InvGroups";

async function parseKillmail(killmail: IESIKillmail, warId: number = 0): Promise<Partial<IKillmail>> {
    const top = await generateTop(killmail, warId);
    const victim = await processVictim(killmail.victim);
    const attackers = await processAttackers(killmail.attackers);
    const items = await processItems(killmail.victim.items, new Date(killmail.killmail_time));

    // Update the last active field for the victim and all attackers
    await updateLastActive(killmail);

    return {
        ...top,
        victim,
        attackers,
        items,
    };
}

async function updateLastActive(killmail: IESIKillmail): Promise<void> {
    // Use the victim character_id, and all the attackers character_ids to update the last_active field in the Characters model
    for (let attacker of killmail.attackers) {
        if (attacker.character_id) {
            // Get the existing last_active from the characters
            let existingLastActive = await Characters.findOne({ character_id: attacker.character_id }, { last_active: 1 });

            // If the last_active on the character is older than the killmail kill_time, update it - otherwise don't
            if (existingLastActive && existingLastActive.last_active < new Date(killmail.killmail_time)) {
                // Update the last_active field for the attacker
                await Characters.updateOne(
                    { character_id: attacker.character_id },
                    { last_active: killmail.killmail_time }
                );
            // In case there is no existingLastActive we set it to what the killmail_time is
            } else if (!existingLastActive) {
                await Characters.updateOne(
                    { character_id: attacker.character_id },
                    { last_active: killmail.killmail_time }
                );
            }
        }
    }

    let existingLastActive = await Characters.findOne({ character_id: killmail.victim.character_id }, { last_active: 1 });
    if (existingLastActive && existingLastActive.last_active < new Date(killmail.killmail_time)) {
        await Characters.updateOne(
            { character_id: killmail.victim.character_id },
            { last_active: killmail.killmail_time }
        );
    // In case there is no existingLastActive we set it to what the killmail_time is
    } else if (!existingLastActive) {
        await Characters.updateOne(
            { character_id: killmail.victim.character_id },
            { last_active: killmail.killmail_time }
        );
    }
}

async function calculateKillValue(killmail: IESIKillmail): Promise<{ item_value: number; ship_value: number; total_value: number }> {
    const shipTypeId = Number(killmail.victim.ship_type_id);
    const shipValue = await getPrice(shipTypeId, new Date(killmail.killmail_time));
    let itemValue = 0;

    for (const item of killmail.victim.items) {
        if (item.items) {
            for (const cargoItem of item.items) {
                itemValue += await getItemValue(cargoItem, new Date(killmail.killmail_time), true);
            }
        }
        itemValue += await getItemValue(item, new Date(killmail.killmail_time));
    }

    return {
        item_value: itemValue,
        ship_value: shipValue,
        total_value: itemValue + shipValue,
    };
}

async function getItemValue(item: IESIVictimItem, killTime: Date, isCargo: boolean = false): Promise<number> {
    const typeId = Number(item.item_type_id);
    const flag = item.flag;

    const id = await getItem(typeId);
    const itemName = id?.type_name || `Type ID ${typeId}`;

    let price = 0;

    if (typeId === 33329 && flag === 89) {
        price = 0.01;
    } else {
        price = await getPrice(typeId, killTime);
    }

    if (isCargo && itemName.includes("Blueprint")) {
        item.singleton = 2;
    }

    if (item.singleton === 2) {
        price /= 100;
    }

    const dropped = Number(item.quantity_dropped || 0);
    const destroyed = Number(item.quantity_destroyed || 0);

    return price * (dropped + destroyed);
}

async function generateTop(killmail: IESIKillmail, warId: number = 0): Promise<Partial<IKillmail>> {
    const solarSystem = await SolarSystems.findOne({ system_id: killmail.solar_system_id });
    const region = solarSystem ? await Regions.findOne({ region_id: solarSystem.region_id }) : null;
    const killValue = await calculateKillValue(killmail);

    const x = killmail.victim?.position?.x || 0;
    const y = killmail.victim?.position?.y || 0;
    const z = killmail.victim?.position?.z || 0;

    return {
        killmail_id: killmail.killmail_id,
        killmail_hash: killmail.killmail_hash,
        kill_time: new Date(killmail.killmail_time),
        system_id: killmail.solar_system_id,
        system_name: solarSystem?.system_name || "",
        system_security: solarSystem?.security || 0,
        region_id: solarSystem?.region_id || 0,
        region_name: region?.region_name || "",
        near: await getNear(Number(x), Number(y), Number(z), Number(killmail.solar_system_id)),
        x,
        y,
        z,
        ship_value: killValue.ship_value,
        fitting_value: killValue.item_value,
        total_value: killValue.total_value,
        is_npc: await isNPC(killmail),
        is_solo: await isSolo(killmail),
        war_id: warId,
    };
}

async function processVictim(victim: IESIVictim): Promise<IVictim> {
    const ship = await getItem(Number(victim.ship_type_id));
    if (!ship) throw new Error(`Type not found for type_id: ${victim.ship_type_id}`);

    const shipGroup = await InvGroups.findOne({ group_id: ship.group_id });
    if (!shipGroup) throw new Error(`Group not found for group_id: ${ship.group_id}`);

    const character = victim.character_id ? await getCharacter(victim.character_id) : null;
    const corporation = await getCorporation(victim.corporation_id);
    const alliance = victim.alliance_id ? await getAlliance(Number(victim.alliance_id)) : null;
    const faction = victim.faction_id ? await getFaction(Number(victim.faction_id)) : null;

    return {
        ship_id: victim.ship_type_id,
        ship_name: ship.type_name,
        ship_group_id: shipGroup.group_id,
        ship_group_name: shipGroup.group_name,
        damage_taken: victim.damage_taken,
        character_id: victim.character_id,
        character_name: character?.name || ship.type_name,
        corporation_id: victim.corporation_id,
        corporation_name: corporation.name,
        alliance_id: victim.alliance_id || 0,
        alliance_name: alliance?.name || "",
        faction_id: victim.faction_id || 0,
        faction_name: faction?.name || "",
    };
}

async function getNear(x: number, y: number, z: number, solarSystemId: number): Promise<string> {
    if (x === 0 && y === 0 && z === 0) {
        return "";
    }

    const distance = 1000 * 3.086e16;

    const celestials = await Celestials.aggregate([
        {
            $match: {
                solar_system_id: solarSystemId,
                x: { $gt: x - distance, $lt: x + distance },
                y: { $gt: y - distance, $lt: y + distance },
                z: { $gt: z - distance, $lt: z + distance },
            },
        },
        {
            $project: {
                item_id: 1,
                item_name: 1,
                distance: {
                    $sqrt: {
                        $add: [
                            { $pow: [{ $subtract: ["$x", x] }, 2] },
                            { $pow: [{ $subtract: ["$y", y] }, 2] },
                            { $pow: [{ $subtract: ["$z", z] }, 2] },
                        ],
                    },
                },
            },
        },
        { $sort: { distance: 1 } },
        { $limit: 1 },
    ]);

    return celestials?.[0]?.item_name || "";
}

async function isNPC(killmail: IESIKillmail): Promise<boolean> {
    const attackerCount = killmail.attackers.length;

    const npcStatuses = await Promise.all(
        killmail.attackers.map(async (attacker) => {
            if (!attacker.ship_type_id) return false;

            const ship = await getItem(attacker.ship_type_id);
            if (!ship) return false;

            const shipGroup = await InvGroups.findOne({ group_id: ship.group_id });
            return shipGroup?.category_id === 11;
        })
    );

    // Count NPC attackers based on resolved statuses
    const npcCount = npcStatuses.filter((isNpc) => isNpc).length;
    return attackerCount > 0 && npcCount > 0 && attackerCount === npcCount;
}

async function isSolo(killmail: IESIKillmail): Promise<boolean> {
    const attackerCount = killmail.attackers.length;
    if (attackerCount === 1) return true;
    if (attackerCount > 2) return false;

    const npcCount = killmail.attackers.filter(
        (attacker) => attacker.character_id === 0 && Number(attacker.corporation_id) < 1999999 && attacker.corporation_id !== 1000125
    ).length;

    return npcCount > 0 && 2 / npcCount === 2;
}

async function processAttackers(attackers: IESIAttacker[]): Promise<IAttacker[]> {
    const processedAttackers: IAttacker[] = [];

    for (const attacker of attackers) {
        const ship = attacker.ship_type_id ? await getItem(attacker.ship_type_id) : attacker.weapon_type_id ? await getItem(attacker.weapon_type_id) : null;
        const weapon = attacker.weapon_type_id ? await getItem(attacker.weapon_type_id) : await getItem(attacker.ship_type_id);

        if (!ship) throw new Error(`Type not found for type_id: ${attacker.ship_type_id}`);
        if (!weapon) throw new Error(`Type not found for type_id: ${attacker.weapon_type_id}`);

        const shipGroup = await InvGroups.findOne({ group_id: ship.group_id });
        if (!shipGroup) throw new Error(`Group not found for group_id: ${ship.group_id}`);

        const character = attacker.character_id ? await getCharacter(attacker.character_id): null;
        const corporation = attacker.corporation_id ? await getCorporation(attacker.corporation_id): null;
        const alliance = attacker.alliance_id ? await getAlliance(Number(attacker.alliance_id)) : null;
        const faction = attacker.faction_id ? await getFaction(Number(attacker.faction_id)) : null;

        processedAttackers.push({
            ship_id: attacker.ship_type_id || attacker.weapon_type_id || 0,
            ship_name: ship.type_name || weapon.type_name || "",
            ship_group_id: shipGroup.group_id || 0,
            ship_group_name: shipGroup.group_name || "",
            character_id: attacker.character_id || 0,
            character_name: character?.name || ship.type_name || weapon.type_name,
            corporation_id: attacker.corporation_id || 0,
            corporation_name: corporation?.name || "",
            alliance_id: attacker.alliance_id || 0,
            alliance_name: alliance?.name || "",
            faction_id: attacker.faction_id || 0,
            faction_name: faction?.name || "",
            security_status: attacker.security_status,
            damage_done: attacker.damage_done,
            final_blow: attacker.final_blow,
            weapon_type_id: attacker.weapon_type_id || 0,
            weapon_type_name: weapon.type_name || "",
        });
    }

    return processedAttackers;
}

async function processItems(items: IESIVictimItem[], killmail_date: Date): Promise<IItem[]> {
    const processedItems: IItem[] = [];

    for (const item of items) {
        const type = await getItem(Number(item.item_type_id));
        if (!type) throw new Error(`Type not found for type_id: ${item.item_type_id}`);

        const group = await InvGroups.findOne({ group_id: type.group_id });
        if (!group) throw new Error(`Group not found for group_id: ${type.group_id}`);

        const nestedItems = item.items ? await processItems(item.items, killmail_date) : [];

        let innerItem: IItem & { items?: IItem[] } = {
            type_id: item.item_type_id,
            type_name: type.type_name || "",
            group_id: type.group_id,
            group_name: group.group_name || "",
            category_id: group.category_id,
            flag: item.flag,
            qty_dropped: Number(item.quantity_dropped || 0),
            qty_destroyed: Number(item.quantity_destroyed || 0),
            singleton: item.singleton,
            value: await getPrice(Number(item.item_type_id), killmail_date)
        };

        if (nestedItems.length > 0) {
            innerItem.items = nestedItems;
        }

        processedItems.push(innerItem);
    }

    return processedItems;
}

export { parseKillmail };
