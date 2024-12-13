import { Worker, Queue } from "bullmq";

function createWorker(queueName: string, jobProcessor: any, options?: any) {
    return new Worker(queueName, async job => {
        await jobProcessor(job);
    }, {
        connection: {
            host: process.env.NODE_ENV === "production" ? process.env.REDIS_URI_PROD : process.env.REDIS_URI_DEV,
            port: 30001,
            db: 1
        },
        ...options
    });
}

function createQueue(name: string) {
  return new Queue(name, {
    connection: {
      host:
        process.env.NODE_ENV === "production"
          ? process.env.REDIS_URI_PROD
          : process.env.REDIS_URI_DEV,
      port: 30001,
      db: 1
    },
  });
}

export { createQueue, createWorker };
