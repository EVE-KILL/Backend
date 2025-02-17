
//https://nitro.unjs.io/config
export default defineNitroConfig({
  preset: "bun",
  srcDir: "server",

  routeRules: {
    "/api/**": {
      cors: true
    },
    "/api/characters": {
      cors: true,
      cache: {
        maxAge: 3600,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/characters/**": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/corporations": {
      cors: true,
      cache: {
        maxAge: 3600,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/corporations/**": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/alliances": {
      cors: true,
      cache: {
        maxAge: 3600,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/alliances/**": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/killlist": {
      cors: true
    },
    "/api/stats": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/search/**": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/wars": {
      cors: true,
      cache: {
        maxAge: 3600,
        staleMaxAge: -1,
        swr: true,
      },
    },
    "/api/wars/**": {
      cors: true,
      cache: {
        maxAge: 300,
        staleMaxAge: -1,
        swr: true,
      },
    },
  },

  imports: {
    dirs: [
      "./server/models/**",
    ],
  },

  scheduledTasks: {
    '0 0 * * *': [
      'updateMeilisearch',
      'updateWars',
      'updateHistoricalCounts',
    ],
    '0 * * * *': [
      'fetchWars',
      'fetchMissedKillmails',
      'updatePrices',
    ],
    '*/5 * * * *': [
      'findNewCharacters',
    ],
    '* * * * *': [
      'tqStatus',
      'affiliationUpdate',
      'processUnprocessedKillmails',
    ],
  },

  experimental: {
    openAPI: true,
    wasm: true,
    tasks: true,
    websocket: true
  },

  openAPI: {
    production: "runtime",
    meta: {
      title: "EVE-KILL API",
      description: "API for EVE-KILL",
      version: "1.0.0",
    },
    ui: {
      scalar: {
        route: "/scalar",
        theme: "dark",
      },
      swagger: {
        route: "/swagger"
      }
    },
  },

  storage: {
    redis: {
      driver: "redis",
      url: 'redis://' + process.env.REDIS_URI ? process.env.REDIS_URI : '192.168.10.10' + ':' + process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      database: process.env.REDIS_DB,
    },
  },

  compatibilityDate: "2024-10-13",
});
