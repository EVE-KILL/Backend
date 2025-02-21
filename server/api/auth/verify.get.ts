import { Users } from "../../models/Users";

export default defineEventHandler(async (event) => {
    let query = getQuery(event);
    let uniqueIdentifier = query.unique_identifier as string;

    // We need to make sure that a user isn't already registered with
    // The characterId and or characterName
    let existingUser = await Users.findOne({
        uniqueIdentifier: uniqueIdentifier,
    });

    if (!existingUser) {
        return {
            status: 400,
            body: {
                message: "User does not exist",
            },
        };
    }

    // Update the uniqueIdentifier for this user to a new identifier
    let newUniqueIdentifier = crypto.randomUUID();
    Users.updateOne(
        { uniqueIdentifier: uniqueIdentifier },
        { uniqueIdentifier: newUniqueIdentifier }
    );

    return {
        status: 200,
        body: {
            message: "User verified",
            newUniqueIdentifier: newUniqueIdentifier,
        },
    };
});
