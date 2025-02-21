import { Users } from "../../models/Users";

export default defineEventHandler(async (event) => {
    let body = await readBody(event);

    let accessToken = body.accessToken as string;
    let expiresIn = body.expiresIn as number;
    let refreshToken = body.refreshToken as string;
    let characterId = body.characterId as number;
    let characterName = body.characterName as string;
    let scopes = (body.scopes as string).split(" ");
    let tokenType = body.tokenType as string;
    let characterOwnerHash = body.characterOwnerHash as string;
    let uniqueIdentifier = body.uniqueIdentifier as string;
    // Convert expiresIn which is a number to a date, by taking current date and adding the seconds to it
    let dateExpiration = new Date(Date.now() + expiresIn * 1000);

    let user = new Users({
        accessToken,
        dateExpiration,
        refreshToken,
        characterId,
        characterName,
        scopes,
        tokenType,
        characterOwnerHash,
        uniqueIdentifier,
    });

    console.log(user);

    try {
        await user.save();
    } catch (error) {
        await Users.updateOne({ characterId: characterId }, {
            accessToken,
            dateExpiration,
            refreshToken,
            characterId,
            characterName,
            scopes,
            tokenType,
            characterOwnerHash,
            uniqueIdentifier,
        });
    }

    return {
        status: 200,
        body: {
            message: "User created",
        },
    };
});
