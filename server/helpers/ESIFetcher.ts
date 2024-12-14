// src/helpers/esiFetcher.ts
import { RedisStorage } from "../helpers/Storage";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize the singleton RedisStorage instance
const storage = RedisStorage.getInstance();

async function esiFetcher(url: string, options?: RequestInit): Promise<any> {
    try {
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

        // Handle progressive backoff based on error limits
        let inverseFactor = 0;

        switch (true) {
            case (esiErrorLimitRemain < 10):
                inverseFactor = (100 - esiErrorLimitRemain) / 50;
                break;
            case (esiErrorLimitRemain < 20):
                inverseFactor = (100 - esiErrorLimitRemain) / 120;
                break;
            case (esiErrorLimitRemain < 50):
                inverseFactor = (100 - esiErrorLimitRemain) / 200;
                break;
            default:
                inverseFactor = (100 - esiErrorLimitRemain) / 300;
                break;
        }

        if (esiErrorLimitRemain < 100) {
            let maxSleepTimeInMicroseconds = esiErrorLimitReset * 1000000; // Convert reset time from seconds to microseconds
            let sleepTimeInMicroseconds = Math.max(1000, (inverseFactor * inverseFactor) * maxSleepTimeInMicroseconds);
            let sleepTimeInMiliseconds = Math.round(sleepTimeInMicroseconds / 1000);

            // Sleeptime in miliseconds should not exceed the reset time (This way we don't sleep for 30s when there is 3s left to reset)
            sleepTimeInMiliseconds = Math.min(sleepTimeInMiliseconds, esiErrorLimitReset * 1000);

            // Log backoff
            //console.warn(`ESI backoff: Remaining=${esiErrorLimitRemain}, Reset=${esiErrorLimitReset}s. Sleeping for ${sleepTimeInMiliseconds}ms`);
            await sleep(sleepTimeInMiliseconds);
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
