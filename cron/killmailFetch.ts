import { cliLogger } from '../server/helpers/Logger';
import { Users } from '../server/models/Users';
import { esiFetcher } from '../server/helpers/ESIFetcher';
import { getCharacter } from '../server/helpers/ESIData';
import { IKillmail } from '~/interfaces/IKillmail';
import { Killmails } from '../server/models/Killmails';
import { addKillmail } from '../server/queue/Killmail';

export default {
    name: "killmailFetch",
    description: "Fetches killmails from ESI Tokens",
    schedule: "* * * * *",
    run: async ({ args }) => {
        // Fetch all users that haven't been checked in the last 5 minutes
        let users = await Users.find({ lastChecked: { $lt: new Date(Date.now() - 60 * 5 * 1000) }}, {
            _id: 1,
            accessToken: 1,
            characterId: 1,
            characterName: 1,
            refreshToken: 1,
            dateExpiration: 1,
        });

        for (let user of users) {
            let accessToken = user.accessToken;
            let characterId = user.characterId;
            let characterName = user.characterName;
            let refreshToken = user.refreshToken;
            let dateExpiration = user.dateExpiration;

            // dateExpiration is the date when the token expires, if that time is less than 5 minutes away, we refresh the token
            if (dateExpiration.getTime() < Date.now() + 60 * 5 * 1000) {
                cliLogger.info(`Refreshing token for ${characterName} (${characterId})`);
                let newTokens = await getNewRefreshToken(refreshToken);
                accessToken = newTokens.access_token;
                dateExpiration = new Date(Date.now() + newTokens.expires_in * 1000);
                refreshToken = newTokens.refresh_token;

                // Update the user with the new tokens
                await Users.updateOne(
                    { _id: user._id },
                    {
                        accessToken: accessToken,
                        dateExpiration: dateExpiration,
                        refreshToken: refreshToken
                    }
                );
            }

            // Fetch killmails
            let character = await getCharacter(characterId);
            let corporationId = character.corporation_id;

            // If the corporation id is under 10000000 we don't wanna fetch corporation killmails
            let fetchCorporation = corporationId < 10000000 ? false : true;
            let canFetchCorporationKillmails = user.canFetchCorporationKillmails;

            let killmails = [];

            // We can get upto 1000 killmails back at a time, if we get 1000 back we need to fetch more by increasing the page number
            let page = 1;
            let killmailsPage = [];
            do {
                killmailsPage = await getCharacterKillmails(accessToken, characterId, page);
                for (let killmail of killmailsPage) {
                    killmails.push(killmail);
                }

                page++;
            } while (killmailsPage.length === 1000);

            if (fetchCorporation && canFetchCorporationKillmails) {
                let page = 1;
                do {
                    killmailsPage = await getCorporationKillmails(accessToken, corporationId, page);
                    if (killmailsPage.error === 'Character does not have required role(s)') {
                        await Users.updateOne(
                            { _id: user._id },
                            { canFetchCorporationKillmails: false }
                        );
                        cliLogger.info(`User ${characterName} (${characterId}) does not have the required role to fetch corporation killmails`);
                        break;
                    }

                    for (let killmail of killmailsPage) {
                        killmails.push(killmail);
                    }

                    page++;
                } while (killmailsPage.length === 1000);
            }

            // Now we filter the killmails if we have already seen them
            for (let killmail of killmails) {
                let killmailId = killmail.killmail_id;
                let killmailHash = killmail.killmail_hash;
                let killmailExists = await Killmails.exists({ killmail_id: killmailId, killmail_hash: killmailHash });
                if (killmailExists) {
                    killmails = killmails.filter(k => k.killmail_id !== killmailId);
                    continue;
                }
            }

            // Send the killmails to the killmail processing queue
            for (let killmail of killmails) {
                addKillmail(killmail.killmail_id, killmail.killmail_hash, null, 1);
            }

            // Update the lastChecked date
            await Users.updateOne(
                { _id: user._id },
                { lastChecked: new Date() }
            );
            cliLogger.info(`Found ${killmails.length} new killmails for ${characterName} (${characterId})`);
        }
    },
};

async function getCharacterKillmails(accessToken: string, characterId: number, page: number = 1): Promise<IKillmail[]>
{
    let killmails = await esiFetcher(`${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/characters/${characterId}/killmails/recent/?page=${page}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    return killmails;
}

async function getCorporationKillmails(accessToken: string, corporationId: number, page: number = 1): Promise<IKillmail[]>
{
    let killmails = await esiFetcher(`${process.env.ESI_URL || 'https://esi.evetech.net/'}latest/corporations/${corporationId}/killmails/recent/?page=${page}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    return killmails;
}

async function getNewRefreshToken(refreshToken: string) {
    let authorization = Buffer.from(`${process.env.EVE_CLIENT_ID}:${process.env.EVE_CLIENT_SECRET}`).toString('base64');
    let payload = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    };

    let response = await fetch("https://login.eveonline.com/v2/oauth/token", {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'EVE-KILL',
            'Authorization': 'Basic ' + authorization,
        },
        body: new URLSearchParams(payload).toString(),
    });

    let data = await response.json();
    return data;
}
