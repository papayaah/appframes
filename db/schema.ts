/**
 * Database schema
 *
 * Re-exports Better Auth tables from the package.
 * Add app-specific tables below.
 */

// Better Auth standard tables (user, account, session, verification + relations)
import {
  user,
  account,
  session,
  verification,
  userRelations,
  accountRelations,
  sessionRelations,
  betterAuthSchema,
} from '@reactkits.dev/better-auth-connect/server/drizzle';

export {
  user,
  account,
  session,
  verification,
  userRelations,
  accountRelations,
  sessionRelations,
  betterAuthSchema,
};

// App-specific tables
import { pgTable, text, integer, timestamp, uuid, index, jsonb, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Projects table
 * Stores user projects with full payload as JSONB for fast iteration.
 * Uses revision-based optimistic concurrency for sync.
 */
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  data: jsonb('data').notNull(), // Full project payload (screensByCanvasSize, etc.)
  revision: bigint('revision', { mode: 'number' }).notNull().default(1),
  deletedAt: timestamp('deleted_at', { mode: 'string' }), // Tombstone for sync-friendly deletion
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  userIdIdx: index('projects_user_id_idx').on(t.userId),
  userUpdatedAtIdx: index('projects_user_updated_at_idx').on(t.userId, t.updatedAt),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
}));

/**
 * Media assets table
 * Stores metadata for user-uploaded media files (images, videos, etc.)
 * Files are stored on local filesystem, path stored in 'path' column
 */
export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // 'image' | 'video' | 'audio' | 'document' | 'other'
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // bytes
  width: integer('width'), // pixels (for images/videos)
  height: integer('height'), // pixels (for images/videos)
  path: text('path').notNull(), // Local filesystem path relative to MEDIA_STORAGE_PATH
  thumbnailPath: text('thumbnail_path'), // Optional thumbnail path
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('media_assets_user_id_idx').on(table.userId),
  createdAtIdx: index('media_assets_created_at_idx').on(table.createdAt),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  user: one(user, {
    fields: [mediaAssets.userId],
    references: [user.id],
  }),
}));
