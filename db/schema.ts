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
import { pgTable, text, integer, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  path: text('path').notNull(), // Local filesystem path relative to MEDIA_STORAGE_PATH (replaces S3/R2 URL from spec)
  thumbnailPath: text('thumbnail_path'), // Optional thumbnail path
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
