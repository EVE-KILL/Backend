import { Worker, Queue } from "bullmq";

function createWorker(queueName: string, jobProcessor: any, options?: any) {
    return new Worker(queueName, async job => {
        await jobProcessor(job);
    }, {
        connection: {
            host: process.env.REDIS_URI ? process.env.REDIS_URI : '192.168.10.10',
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
            db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
        },
        ...options
    });
}

function createQueue(name: string) {
  return new Queue(name, {
    connection: {
        host: process.env.REDIS_URI ? process.env.REDIS_URI : '192.168.10.10',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
    },
  });
}

export { createQueue, createWorker };
