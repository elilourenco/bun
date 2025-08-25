import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { postsRoutes } from './src/routes/posts';
import { ScraperService } from './src/services/scraper';
import { createMediaProcessorWorker } from './src/workers/mediaworkers';

const app = new Elysia()
  .use(swagger())
  .use(postsRoutes)
  .get('/health', () => ({ status: 'ok' }))
  .get('/scrape', async () => {
    const scraper = new ScraperService();
    await scraper.scrapeActiveCampaigns();
    return { message: 'Scraping iniciado' };
  })
  .listen(3001);

// Iniciar worker
const mediaWorker = createMediaProcessorWorker();

console.log(` Elysia is running at ${app.server?.hostname}:${app.server?.port}`);