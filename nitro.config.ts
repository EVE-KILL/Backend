//https://nitro.unjs.io/config
export default defineNitroConfig({
  preset: "bun",
  srcDir: "server",

  routeRules: {
    "/api/**": {
      cors: true
    },
    "/api/killlist": {
      cors: true,
      cache: {
        maxAge: 10,
        staleMaxAge: -1,
        swr: true,
      },
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
  },

  imports: {
    dirs: [
      "./server/models/**",
    ],
  },

  scheduledTasks: {
    '0 0 * * *': [
      'updatePrices',
      'updateMeilisearch',
      'updateWars',
    ],
    '0 * * * *': [
      'fetchWars',
    ],
    '* * * * *': [
      'tqStatus',
      'affiliationUpdate',
    ],
  },

  experimental: {
    openAPI: true,
    wasm: true,
    tasks: true,
    websocket: true
  },

  openAPI: {
    meta: {
      title: "EVE-KILL API",
      description: "API for EVE-KILL",
      version: "1.0.0",

    },
    ui: {
      scalar: {
        theme: "dark",
      },
    },
  },

  storage: {
    redis: {
      driver: "redis",
      url: 'redis://' + process.env.NODE_ENV === 'production' ? process.env.REDIS_URI_PROD : process.env.REDIS_URI_DEV + ':30001',
      database: 1,
    },
  },

  compatibilityDate: "2024-10-13",
});
