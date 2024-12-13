import { AuthKey } from '~/models/AuthKeys';
import { broadcastKillmail } from '~/helpers/WSClientManager';
import { determineRoutingKeys } from '~/helpers/DetermineRoutingKeys';

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: 'Missing Authorization header' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid Authorization header format' });
    }

    const keyDoc = await AuthKey.findOne({ key: token, isActive: true });
    if (!keyDoc) {
        throw createError({ statusCode: 403, statusMessage: 'Invalid or inactive key' });
    }

    const body = await readBody(event);
    if (!body || !body.killmail) {
        throw createError({ statusCode: 400, statusMessage: 'Missing killmail data in request body' });
    }

    const killmail = body.killmail;
    const routingKeys = determineRoutingKeys(killmail);
    await broadcastKillmail(killmail, routingKeys);

    return { status: 'ok' };
});
