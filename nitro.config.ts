import { readFileSync } from "fs";
import yaml from "yaml";

// Load apiCacheTimes.yaml
const apiCacheTimes = readFileSync('./apiCacheTimes.yaml', 'utf8');

//https://nitro.unjs.io/config
export default defineNitroConfig({
  preset: "bun",
  srcDir: "server",
  minify: true,
  sourceMap: true,

  routeRules: routeRuleGenerator(),

  imports: {
    dirs: [
      "./server/models/**",
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

function routeRuleGenerator(): Record<string, any> {
  // Build route rules as an object with a default rule for /api/**
  const rules: Record<string, any> = {
    "/api/**": { cors: true },
  };

  // Parse YAML
  const cacheTimes = yaml.parse(apiCacheTimes);

  // Merge routes from YAML:
  for (const route in cacheTimes) {
    rules['/api' + route] = {
      cors:true,
      cache: {
        maxAge: cacheTimes[route].maxAge || 60,
        staleMaxAge: cacheTimes[route].staleMaxAge || -1,
        swr: cacheTimes[route].swr || true,
      }
    };
  }

  return rules;
}
