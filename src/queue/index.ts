import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Configuração correta para BullMQ
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // ← Isso resolve o erro
  enableReadyCheck: false,
});

export const mediaQueue = new Queue('media-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export function createMediaWorker() {
  return new Worker('media-processing', async (job) => {
    const { mediaId, postId, mediaUrl } = job.data;
    
    console.log(`Processando mídia ${mediaId} do post ${postId}`);
    
    return { success: true, mediaId };
  }, { 
    connection,
    limiter: {
      max: 10, // Máximo de jobs por segundo
      duration: 1000,
    },
  });
} 