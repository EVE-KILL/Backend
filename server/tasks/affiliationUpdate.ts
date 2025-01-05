import _ from 'lodash';
import { esiFetcher } from '~/helpers/ESIFetcher';
import { queueUpdateAlliance } from '~/queue/Alliance';
import { queueUpdateCharacter } from '~/queue/Character';
import { queueUpdateCorporation } from '~/queue/Corporation';

export default defineTask({
  meta: {
    name: "update:affiliations",
    description: "Updates the affiliations of cgaracters",
  },
  async run({ payload, context }) {
    let characterCount = await Characters.estimatedDocumentCount();
    // We need to fetch all characters as a minimum every 24h
    let limit = Math.max(1, Math.floor(characterCount / (60 * 24)));

    let characters = await Characters.find({
      // Get all characters that have not been updated in the last 24h
      updatedAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      deleted: { $ne: true },
    }, {
      _id: 0,
      character_id: 1,
      corporation_id: 1,
      alliance_id: 1,
    }, {
      limit: limit,
    });

    // We can only fetch upwards of 1000 characters at a time, so we have to spluit the characters into chunks
    let characterChunks = _.chunk(characters, 1000);
    let queuedCount = 0;

    // For each character chunk we fetch the character data
    for (let chunk of characterChunks) {
      let count = await processChunk(chunk);
      queuedCount += count;
    }

    return { result: {
      queued: queuedCount
    } }
  },
});

async function processChunk(characters: ICharacters[], attempt: number = 0): Promise<number> {
  let queuedCount = 0;
  let affiliations: ICharacters[] = await fetchAffiliations(characters, attempt);

  let originalDataLookup = {};
  for (let character of characters) {
    originalDataLookup[character.character_id] = character;
  }

  let affiliationLookup = {};
  for (let affiliation of affiliations) {
    affiliationLookup[affiliation.character_id] = affiliation;
  }

  let updates: Partial<ICharacters>[] = [];
  for (let affiliation of affiliations) {
    let characterId = affiliation.character_id;

    let originalData = originalDataLookup[characterId];
    if (!originalData) {
      continue;
    }

    if (
      affiliation.corporation_id &&
      originalData.corporation_id &&
      affiliation.corporation_id !== originalData.corporation_id
    ) {
      updates.push({
        character_id: characterId,
        corporation_id: affiliation.corporation_id,
      });
    }

    // Opdater alliance_id hvis der er ændring
    if (
      affiliation.alliance_id &&
      originalData.alliance_id &&
      affiliation.alliance_id !== originalData.alliance_id
    ) {
      updates.push({
        character_id: characterId,
        alliance_id: affiliation.alliance_id,
      });
    }
  }

  // For each update, update the corporation / alliance using the queue
  for (let update of updates) {
    await queueUpdateCharacter(update.character_id);
    if (update.corporation_id) {
      await queueUpdateCorporation(update.corporation_id);
    }
    if (update.alliance_id) {
      await queueUpdateAlliance(update.alliance_id);
    }
    queuedCount++;
  }

  // All the characters that did not need an update, needs to be updated separately with a new updatedAt time, to ensure they aren't processed again for another 24h
  // Use the updates array to filter out the characters that were updated - and remove them from the original data, and then update the rest
  let updatedCharacterIds = updates.map(update => update.character_id);
  let charactersToUpdate = characters.filter(character => !updatedCharacterIds.includes(character.character_id));
  for (let character of charactersToUpdate) {
    await Characters.updateOne({
      character_id: character.character_id,
    }, {
      updatedAt: new Date(),
    });
  }

  return queuedCount;
}

async function fetchAffiliations(characters: ICharacters[], attempts: number = 0) {
  // We can fetch upto 1000 characters at the same time against the affiliation endpoint
  // However, if one of the characters fails in the affiliation endpoint, we get an error back from ESI
  // At that point, we have to split the amount of characters we are fetching by half, and try each half separately
  // If a half works, it's processed, if it fails, we split it again
  // This is done 3 times - at which point the failing half is processed one by one via the queue (For now just placeholder it for submission as character_id: character_id)
  let affiliations = [];
  let character_ids = characters.map(character => character.character_id);

  try {
    let response = await esiFetcher("https://esi.evetech.net/v1/characters/affiliation/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(character_ids),
    });

    // Merge the response with the affiliations
    affiliations = affiliations.concat(response);
  } catch (error) {
    if (attempts > 3) {
      console.log("Failed to fetch affiliations for characters", character_ids);
      for (let character_id of character_ids) {
        queueUpdateCharacter(character_id);
      }
    } else {
      // Split character_ids into two halves
      let half = Math.ceil(character_ids.length / 2);

      // Process both halves
      let firstHalfAttempts = attempts;
      let secondHalfAttempts = attempts;
      let firstHalf = processChunk(characters.slice(0, half), firstHalfAttempts + 1);
      let secondHalf = processChunk(characters.slice(half), secondHalfAttempts + 1);

      // Merge the results
      affiliations = affiliations.concat(firstHalf, secondHalf);
    }
  }

  return affiliations;
}

interface ICharacters {
  character_id: number;
  corporation_id: number;
  alliance_id: number;
}
