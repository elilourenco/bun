import { Elysia, t } from 'elysia';
import { db } from '../db';
import { posts, media, campaigns, requirements } from '../db/schema';
import { eq, and, or, count, sql } from 'drizzle-orm';

export const postsRoutes = new Elysia({ prefix: '/posts' })
  .get('/', async ({ query }) => {
    const { campaignId, status, page = '1', limit = '10' } = query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereConditions = [];
    
    if (campaignId) {
      whereConditions.push(eq(requirements.campaignId, parseInt(campaignId)));
    }
    
    if (status) {
      whereConditions.push(eq(posts.status, status));
    }
    
    const postsData = await db.query.posts.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        requirement: {
          with: {
            campaign: true,
          },
        },
        media: true,
      },
      limit: limitNum,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
    
    const total = await db.select({ count: count() })
      .from(posts)
      .leftJoin(requirements, eq(posts.requirementId, requirements.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const safeCount = await db.select({ count: count() })
      .from(media)
      .where(eq(media.classification, 'safe'));
    
    return {
      data: postsData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / limitNum),
      },
      stats: {
        safeMedia: safeCount[0]?.count || 0,
      },
    };
  })
  .get('/:id', async ({ params }) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, parseInt(params.id)),
      with: {
        requirement: {
          with: {
            campaign: true,
          },
        },
        media: true,
      },
    });
    
    if (!post) {
      throw new Error('Post não encontrado');
    }
    
    return post;
  });