import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { media, posts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuração correta para BullMQ
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // ← Isso resolve o erro
  enableReadyCheck: false,
});

// Funções utilitárias
async function simulateDownload(url: string) {
  await new Promise(resolve => setTimeout(resolve, faker.number.int({ min: 100, max: 1000 })));
}

async function saveToS3(mediaId: number): Promise<string> {
  const s3Dir = path.join(process.cwd(), 's3');
  try {
    await fs.access(s3Dir);
  } catch {
    await fs.mkdir(s3Dir, { recursive: true });
  }
  
  const fileName = `media_${mediaId}_${Date.now()}.txt`;
  const filePath = path.join(s3Dir, fileName);
  
  await fs.writeFile(filePath, `Conteúdo simulado da mídia ${mediaId}`);
  
  return filePath;
}

function simulateAIClassification(): string {
  const classifications = ['safe', 'explicit', 'unknown'];
  return faker.helpers.arrayElement(classifications);
}

async function checkPostStatus(postId: number) {
  const postMedia = await db.query.media.findMany({
    where: eq(media.postId, postId),
  });
  
  const allProcessed = postMedia.every(m => m.classification !== 'unknown');
  const hasError = postMedia.some(m => m.classification === 'error');
  
  let status = 'pending';
  if (hasError) {
    status = 'error';
  } else if (allProcessed) {
    status = 'processed';
  }
  
  if (status !== 'pending') {
    await db.update(posts)
      .set({ status })
      .where(eq(posts.id, postId));
  }
}

async function processMediaJob(job: any) {
  const { mediaId, postId, mediaUrl } = job.data;
  
  try {
    console.log(`Processando mídia ${mediaId}`);
    
    // 1. Simular download
    await simulateDownload(mediaUrl);
    
    // 2. Salvar no S3 simulado
    const filePath = await saveToS3(mediaId);
    
    // 3. Classificação com IA simulada
    const classification = simulateAIClassification();
    
    // 4. Atualizar banco
    await db.update(media)
      .set({ 
        filePath,
        classification,
      })
      .where(eq(media.id, mediaId));
    
    // 5. Verificar se todas as mídias do post foram processadas
    await checkPostStatus(postId);
    
    return { success: true, mediaId, classification };
    
  } catch (error) {
    console.error(`Erro processando mídia ${mediaId}:`, error);
    
    // Marcar como erro no banco
    await db.update(media)
      .set({ classification: 'error' })
      .where(eq(media.id, mediaId));
    
    throw error;
  }
}

export function createMediaProcessorWorker() {
  return new Worker('media-processing', processMediaJob, { 
    connection,
    limiter: {
      max: 5, // Processar até 5 jobs por segundo
      duration: 1000,
    },
  });
}