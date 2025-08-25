import { faker } from '@faker-js/faker';
import { db } from '../db';
import { requirements, posts, media } from '../db/schema';
import { mediaQueue } from '../queue/index';
import { eq } from 'drizzle-orm';

export class ScraperService {
  async scrapeActiveCampaigns() {
    // Buscar requirements de campanhas ativas
    const activeRequirements = await db.query.requirements.findMany({
      where: (requirements, { eq }) => eq(requirements.campaignId, 1),
      with: {
        campaign: true,
      },
    });

    for (const requirement of activeRequirements) {
      await this.scrapeRequirement(requirement);
    }
  }

  private async scrapeRequirement(requirement: any) {
    const numPosts = faker.number.int({ min: 3, max: 5 });
    
    for (let i = 0; i < numPosts; i++) {
      const post = await this.createPost(requirement);
      if (!post) {
        console.error('Falha ao criar post');
        continue;
      }
      
      const numMedia = faker.number.int({ min: 1, max: 3 });
      
      for (let j = 0; j < numMedia; j++) {
        await this.createMedia(post, requirement);
      }
    }
  }

  private async createPost(requirement: any) {
    try {
      const result = await db.insert(posts).values({
        requirementId: requirement.id,
        platformId: faker.string.uuid(),
        status: 'pending',
      }).returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      return null;
    }
  }

  private async createMedia(post: any, requirement: any) {
    try {
      const mediaUrl = faker.image.url();
      const result = await db.insert(media).values({
        postId: post.id,
        filePath: `s3://bucket/${faker.string.uuid()}.jpg`,
        classification: 'unknown',
      }).returning();

      // Garantir que temos um registro válido
      const mediaRecord = result[0];
      if (!mediaRecord) {
        throw new Error('Nenhum registro de mídia retornado');
      }

      // Enfileirar processamento
      await mediaQueue.add('process-media', {
        mediaId: mediaRecord.id,
        postId: post.id,
        mediaUrl,
        requirementId: requirement.id,
      });

      return mediaRecord;
    } catch (error) {
      console.error('Erro ao criar mídia:', error);
      return null;
    }
  }
}