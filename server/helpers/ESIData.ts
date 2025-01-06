import { Characters } from "../models/Characters";
import { Corporations } from "../models/Corporations";
import { Alliances } from "../models/Alliances";
import { Factions } from "../models/Factions";
import { KillmailsESI } from "../models/KillmailsESI";
import { InvTypes } from "../models/InvTypes";
import { Wars } from "../models/Wars";
import { ICharacter } from "../interfaces/ICharacter";
import { ICorporation } from "../interfaces/ICorporation";
import { IAlliance } from "../interfaces/IAlliance";
import { IFaction } from "../interfaces/IFaction";
import { IESIKillmail } from "../interfaces/IESIKillmail";
import { IItem } from "../interfaces/IKillmail";
import { IWar } from "..//interfaces/IWar";
import { esiFetcher } from "./ESIFetcher";

async function fetchESIKillmail(killmailId: number, killmailHash: string): Promise<IESIKillmail> {
  // Check if the killmail is in the KillmailESI model first
  let dbKillmail: IESIKillmail | null = await KillmailsESI.findOne({ killmail_id: killmailId }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 });
  if (dbKillmail) {
    return dbKillmail;
  }

  try {
    let esiKillmail: IESIKillmail = await esiFetcher(`${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/killmails/${killmailId}/${killmailHash}/`);
    esiKillmail.killmail_hash = killmailHash;

    // Insert the killmail into the esi killmails table
    let km = new KillmailsESI(esiKillmail);
    await km.save();

    return esiKillmail;
  } catch (error) {
    throw new Error(`error: ${error.message} | response: ${error.response}`);
  }
}

async function getCharacter(character_id: number, force_update: boolean = false): Promise<ICharacter> {
  let character: ICharacter | null = null;
  const now = new Date();
  // When force_update is true, check if the character was updated in the last 24h, if it was return that - otherwise check the last 30 days (This prevents spamming the ESI API, seeing as characters can't change corporations more than every 24h anyway)
  const daysAgo = force_update ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  character = await Characters.findOne(
    {
      character_id: character_id,
      updatedAt: { $gte: daysAgo }
    },
    { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
  );

  if (character) {
    if (force_update) {
      await Characters.updateOne({ character_id: character_id }, { $set: { updatedAt: new Date() } });
    }
    return character;
  }

  // Fetch character from external API if not found or outdated
  let data: ICharacter | null = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/characters/${character_id}/?datasource=tranquility`
  );

  // Handle errors
  if (data.error) {
    switch (data.error) {
      case "Character has been deleted!":
        data = await deletedCharacterInfo(character_id);
        break;
      case "Character not found":
        return { error: "Character not found" };
      default:
        throw new Error(`ESI Error: ${data.error} | URL: ${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/characters/${character_id}/?datasource=tranquility`);
    }
  }

  // Add character_id to data
  data.character_id = character_id;

  // Get character history (If it doesn't exist, or if character isn't deleted)
  if (!data.history && !data.deleted) {
    let history = await getCharacterHistory(character_id);
    data.history = history;
  }

  // Save character to database
  let characterModel = new Characters(data);
  try {
    await characterModel.save();
  } catch (error) {
    await Characters.updateOne({ character_id: character_id }, data);
  }

  // Return character
  return data;
}

async function deletedCharacterInfo(character_id: number): Promise<ICharacter> {
  let existingCharacter: ICharacter | null = await Characters.findOne(
    { character_id: character_id },
    { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
  );
  return {
    character_id: character_id,
    name: existingCharacter?.name || "Deleted",
    description:
      existingCharacter?.description || "This character has been deleted",
    birthday: existingCharacter?.birthday || new Date("2003-01-01 00:00:00"),
    gender: existingCharacter?.gender || "Unknown",
    race_id: existingCharacter?.race_id || 0,
    security_status: existingCharacter?.security_status || 0,
    bloodline_id: existingCharacter?.bloodline_id || 0,
    corporation_id: existingCharacter?.corporation_id || 0,
    alliance_id: existingCharacter?.alliance_id || 0,
    faction_id: existingCharacter?.faction_id || 0,
    history: existingCharacter?.history || [],
    deleted: true,
  };
}

async function getCharacterHistory(character_id: Number): Promise<Object[]> {
  let history = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/characters/${character_id}/corporationhistory/?datasource=tranquility`
  );

  return history;
}

async function getCorporation(corporation_id: Number, force_update: boolean = false): Promise<ICorporation> {
  const now = new Date();
  const daysAgo = force_update ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let corporation: ICorporation | null = await Corporations.findOne(
    {
      corporation_id: corporation_id,
      updatedAt: { $gte: daysAgo },
    },
    { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
  );

  if (corporation) {
    if (force_update) {
      await Corporations.updateOne({ corporation_id: corporation_id }, { $set: { updatedAt: new Date() } });
    }
    return corporation;
  }

  // Fetch corporation from external API if not found or outdated
  let data = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/corporations/${corporation_id}/?datasource=tranquility`
  );

  // Add corporation_id to data
  data.corporation_id = corporation_id;

  // Get corporation history
  let history = await getCorporationHistory(corporation_id);
  data.history = history;

  // Save corporation to database
  let corporationModel = new Corporations(data);
  try {
    await corporationModel.save();
  } catch (error) {
    await Corporations.updateOne({ corporation_id: corporation_id }, data);
  }

  // Return corporation
  return data;
}

async function getCorporationHistory(
  corporation_id: Number
): Promise<Object[]> {
  let history = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/corporations/${corporation_id}/alliancehistory/?datasource=tranquility`
  );

  return history;
}

async function getAlliance(alliance_id: Number, force_update: boolean = false): Promise<IAlliance> {
  const now = new Date();
  const daysAgo = force_update ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let alliance: IAlliance | null = await Alliances.findOne(
    {
      alliance_id: alliance_id,
      updatedAt: { $gte: daysAgo },
    },
    { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
  );

  if (alliance) {
    if (force_update) {
      await Alliances.updateOne({ alliance_id: alliance_id }, { $set: { updatedAt: new Date() } });
    }
    return alliance;
  }

  // Fetch alliance from external API if not found or outdated
  let data = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/alliances/${alliance_id}/?datasource=tranquility`
  );

  // Add alliance_id to data
  data.alliance_id = alliance_id;

  // Save alliance to database
  let allianceModel = new Alliances(data);
  try {
    await allianceModel.save();
  } catch (error) {
    await Alliances.updateOne({ alliance_id: alliance_id }, data);
  }

  // Return alliance
  return data;
}

async function getFaction(faction_id: Number): Promise<IFaction | null> {
  let faction: IFaction | null = await Factions.findOne(
    { faction_id: faction_id },
    { _id: 0, __v: 0, createdAt: 0 }
  );

  // Factions don't have a history, and can't be fetched from ESI, so if it doesn't exist in the database, return null
  return faction;
}

async function getItem(item_id: Number): Promise<IItem> {
  let item: IItem | null = await InvTypes.findOne(
    { type_id: item_id },
    { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
  );

  if (item) {
    return item;
  }

  // Fetch item from external API if not found
  let data = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/universe/types/${item_id}/?datasource=tranquility`
  );

  data.type_id = item_id;

  // Rename name to type_name
  data.type_name = data.name;

  // Save item to database
  let itemModel = new InvTypes(data);
  try {
    await itemModel.save();
  } catch (error) {
    await InvTypes.updateOne({ type_id: item_id }, data);
  }

  // Return item
  return data;
}

async function getWar(war_id: Number): Promise<IWar> {
  let data = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/wars/${war_id}/?datasource=tranquility`
  );

  // id is already set, delete it and add it again as war_id
  delete data.id;
  data.war_id = war_id;

  // Save war to database
  let warModel = new Wars(data);
  try {
    await warModel.save();
  } catch (error) {
    await Wars.updateOne({ war_id: war_id }, data);
  }

  // Return war
  return data;
}

async function getWarKillmails(war_id: Number): Promise<{ killmail_id: number; killmail_hash: string }[]> {
  let data = await esiFetcher(
    `${process.env.ESI_URL || 'https://esi.evetech.net/'}/latest/wars/${war_id}/killmails/?datasource=tranquility`
  );

  return data;
}

export {
  getCharacter,
  getCharacterHistory,
  getCorporation,
  getCorporationHistory,
  getAlliance,
  getFaction,
  getItem,
  getWar,
  fetchESIKillmail,
  getWarKillmails,
};
