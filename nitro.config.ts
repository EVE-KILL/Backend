import { readFileSync } from "node:fs";
import yaml from "yaml";

// Load apiCacheTimes.yaml
const apiCacheTimes = readFileSync("./apiCacheTimes.yaml", "utf8");

//https://nitro.unjs.io/config
export default defineNitroConfig({
  preset: "bun",
  srcDir: "server",
  minify: true,
  sourceMap: true,

  runtimeConfig: {
    enabledRunTimeCache: true,
  },

  esbuild: {
    options: {
      target: "esnext",
    },
  },

  routeRules: routeRuleGenerator(),

  imports: {
    dirs: ["./server/models/**"],
  },

  experimental: {
    asyncContext: true,
    openAPI: true,
    wasm: true,
    tasks: true,
    websocket: true,
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
        route: "/swagger",
      },
    },
  },

  storage: {
    redis: {
      driver: "redis",
      url: `redis://${process.env.REDIS_URI || "192.168.10.10"}:${process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT) : 6379}`,
      database: process.env.REDIS_DB,
    },
  },

  compatibilityDate: "2024-10-13",
});

function routeRuleGenerator(debug = false): Record<string, any> {
  // Build route rules as an object with a default rule for /api/**
  const rules: Record<string, any> = {
    "/api/**": { cors: true },
  };

  if (debug === true) {
    return rules;
  }

  // Parse YAML
  const cacheTimes = yaml.parse(apiCacheTimes);

  // Merge routes from YAML:
  for (const route in cacheTimes) {
    rules[`/api${route}`] = {
      cors: true,
      cache: {
        maxAge: cacheTimes[route].maxAge || 60,
        staleMaxAge: cacheTimes[route].staleMaxAge || -1,
        swr: cacheTimes[route].swr || true,
      },
    };
  }

  return rules;
}
