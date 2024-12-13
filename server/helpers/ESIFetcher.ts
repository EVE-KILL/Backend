// src/helpers/esiFetcher.ts
import { RedisStorage } from "../helpers/Storage";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Configure your rate limit here
const MAX_REQUESTS_PER_SECOND = 100;

// Initialize the singleton RedisStorage instance
const storage = RedisStorage.getInstance();

async function enforceRateLimit() {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const key = `rate_limit:${nowInSeconds}`;

    // Try to increment the request count for the current second
    let currentCountStr = await storage.get(key);
    let currentCount = currentCountStr ? Number(currentCountStr) : 0;
    currentCount += 1;
    await storage.set(key, currentCount.toString());

    // If we just created the key, set expiry so it won't linger
    if (currentCount === 1) {
        await storage.getClient().expire(key, 2); // expire after 2 seconds to cover a second rollover
    }

    // If we've exceeded the max requests for this second, sleep until the next second starts
    if (currentCount > MAX_REQUESTS_PER_SECOND) {
        const msUntilNextSecond = 1000 - (Date.now() % 1000);
        console.warn(`Rate limit exceeded (${currentCount}/${MAX_REQUESTS_PER_SECOND}). Sleeping for ${msUntilNextSecond}ms...`);
        await sleep(msUntilNextSecond);
    }
}

async function esiFetcher(url: string, options?: RequestInit): Promise<any> {
    try {
        // Enforce the global rate limit before performing the fetch
        //await enforceRateLimit();

        // Check if TQ is offline
        const tqOffline = (await storage.get('tqStatus')) === 'offline';
        if (tqOffline) {
            console.warn('TQ is offline. Sleeping for 5 seconds before throwing...');
            await sleep(5000);
            throw new Error('TQ is offline, fetcher cannot proceed.');
        }

        // Check if fetcher is paused
        const fetcherPausedUntil = await storage.get('fetcher_paused');
        const fetcherPaused = fetcherPausedUntil && Number(fetcherPausedUntil) > Date.now();
        if (fetcherPaused) {
            const pauseUntil = new Date(Number(fetcherPausedUntil)).toISOString();
            const sleepTime = Number(fetcherPausedUntil) - Date.now();
            console.warn(`Fetcher is paused until ${pauseUntil}. Sleeping for ${sleepTime}ms before throwing...`);
            await sleep(sleepTime);
            throw new Error(`Fetcher is paused until ${pauseUntil}.`);
        }

        let response: Response;
        try {
            response = await fetch(url, options);
        } catch (error: any) {
            console.error("Fetch error:", error);
            throw error; // Re-throw error after logging
        }

        // Extract ESI Headers
        const esiErrorLimitRemain = Number(response.headers.get('X-Esi-Error-Limit-Remain') ?? 100);
        const esiErrorLimitReset = Number(response.headers.get('X-Esi-Error-Limit-Reset') ?? 0);

        // Store these values in Redis for reference
        await storage.set('esi_error_limit_remaining', esiErrorLimitRemain);
        await storage.set('esi_error_limit_reset', esiErrorLimitReset);

        // Handle progressive backoff based on error limits
        if (esiErrorLimitRemain < 100) {
            const maxSleepTimeInMs = esiErrorLimitReset * 1000; // Convert reset time from seconds to milliseconds
            const inverseFactor = (100 - esiErrorLimitRemain) / 100;
            const sleepTimeInMs = Math.max(0, inverseFactor * inverseFactor * maxSleepTimeInMs);

            //console.warn(`ESI backoff: Remaining=${esiErrorLimitRemain}, Reset=${esiErrorLimitReset}s. Sleeping for ${sleepTimeInMs}ms`);
            await sleep(sleepTimeInMs);
        }

        // Handle 420 responses by pausing fetches
        if (response.status === 420) {
            const now = new Date();
            const expiresHeader = response.headers.get('Expires') ?? now.toUTCString();
            const dateHeader = response.headers.get('Date') ?? now.toUTCString();

            const expiresTime = new Date(expiresHeader).getTime();
            const serverTime = new Date(dateHeader).getTime();
            let expiresInSeconds = (expiresTime - serverTime) / 1000;
            if (isNaN(expiresInSeconds)) {
                expiresInSeconds = 60;
            } else {
                expiresInSeconds = Math.abs(expiresInSeconds);
            }

            const sleepTime = expiresInSeconds === 0 ? 60 : expiresInSeconds;
            console.warn(`Status 420 received. Sleeping for ${sleepTime}s and pausing fetcher.`);

            // Set fetcher_paused so other fetches will pause
            const pauseUntilTimestamp = Date.now() + sleepTime * 1000;
            await storage.set('fetcher_paused', pauseUntilTimestamp.toString());

            await sleep(sleepTime * 1000);

            throw new Error(`Status 420: Rate limited. Paused fetcher for ${sleepTime}s.`);
        }

        return await response.json();
    } catch (error) {
        console.error('esiFetcher encountered an error:', error);
        throw error; // Ensure errors are propagated
    }
}

export { esiFetcher };
