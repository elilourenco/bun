import { pgTable, serial, varchar, boolean, timestamp, integer, text, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const requirements = pgTable('requirements', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  platform: varchar('platform', { length: 20 }).notNull(), // 'instagram' | 'tiktok'
  hashtag: varchar('hashtag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  requirementId: integer('requirement_id').references(() => requirements.id),
  platformId: varchar('platform_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending' | 'processed' | 'error'
  createdAt: timestamp('created_at').defaultNow(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  classification: varchar('classification', { length: 20 }).default('unknown'), // 'safe' | 'explicit' | 'unknown'
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations 
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  requirements: many(requirements),
}));

export const requirementsRelations = relations(requirements, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [requirements.campaignId],
    references: [campaigns.id],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  requirement: one(requirements, {
    fields: [posts.requirementId],
    references: [requirements.id],
  }),
  media: many(media),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  post: one(posts, {
    fields: [media.postId],
    references: [posts.id],
  }),
}));