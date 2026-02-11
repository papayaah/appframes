#!/usr/bin/env npx tsx
/**
 * Media Library Health Check Script
 *
 * Queries the production server database to check media library status.
 * Server info is read from terraform/terraform.tfvars or environment variables.
 *
 * Usage:
 *   npx tsx scripts/check-media.ts
 *   # or
 *   npm run check-media
 *
 * Environment variables (optional, overrides terraform.tfvars):
 *   SERVER_IP - Server IP address
 *   SSH_USER - SSH user (default: root)
 *   REMOTE_DIR - Remote directory (default: /srv/appframes)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Parse terraform.tfvars to extract values
function parseTfvars(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(filePath)) return vars;

  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    // Match: key = "value" or key = value
    const match = line.match(/^\s*(\w+)\s*=\s*"?([^"#\n]+)"?\s*(?:#.*)?$/);
    if (match) {
      vars[match[1]] = match[2].trim();
    }
  }
  return vars;
}

// Get config from terraform.tfvars or environment
const tfvarsPath = join(__dirname, '..', 'terraform', 'terraform.tfvars');
const tfvars = parseTfvars(tfvarsPath);

const SERVER_IP = process.env.SERVER_IP || tfvars.server_ip;
const SSH_USER = process.env.SSH_USER || 'root';
const APP_NAME = process.env.APP_NAME || tfvars.app_name || 'appframes';
const REMOTE_DIR = process.env.REMOTE_DIR || `/srv/${APP_NAME}`;

if (!SERVER_IP) {
  console.error('❌ Error: Could not determine server IP.');
  console.error('   Set SERVER_IP env var or ensure terraform/terraform.tfvars exists.');
  process.exit(1);
}

const SERVER = `${SSH_USER}@${SERVER_IP}`;

function runQuery(sql: string): string {
  // Use single quotes for the outer command and escape single quotes in SQL
  const cleaned = sql.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const escaped = cleaned.replace(/'/g, "'\\''");
  const cmd = `ssh ${SERVER} 'cd ${REMOTE_DIR} && docker compose exec -T postgres psql -U postgres -d ${APP_NAME} -c "${escaped}"'`;
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: any) {
    return error.stdout || error.message;
  }
}

function runShell(cmd: string): string {
  const fullCmd = `ssh ${SERVER} "cd ${REMOTE_DIR} && docker compose exec -T web sh -c '${cmd}'"`;
  try {
    return execSync(fullCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: any) {
    return error.stdout || error.message;
  }
}

console.log('🔍 Media Library Health Check\n');
console.log(`   Server: ${SERVER}`);
console.log(`   Remote: ${REMOTE_DIR}`);
console.log('='.repeat(50));

// 1. Total media count
console.log('\n📊 Media Assets Summary\n');
console.log(runQuery('SELECT COUNT(*) as total_media FROM media_assets;'));

// 2. Media per user
console.log('\n👤 Media Per User\n');
console.log(runQuery(`
  SELECT u.email, COUNT(*) as count
  FROM media_assets m
  LEFT JOIN "user" u ON m.user_id = u.id
  GROUP BY u.email
  ORDER BY count DESC;
`));

// 3. Recent uploads
console.log('\n📅 Recent 10 Uploads\n');
console.log(runQuery(`
  SELECT file_name, file_type, size/1024 as kb, created_at
  FROM media_assets
  ORDER BY created_at DESC
  LIMIT 10;
`));

// 4. Files on disk
console.log('\n💾 Files on Disk\n');
const fileCount = runShell(`find ${REMOTE_DIR}/media -type f | wc -l`).trim();
console.log(`Total files: ${fileCount}`);

// 5. Directory breakdown
console.log('\n📁 Storage Directories\n');
console.log(runShell(`ls -la ${REMOTE_DIR}/media/`));

// 6. Check for orphaned media (media in DB but not used in projects)
console.log('\n🔍 Orphaned Media Check\n');
console.log(runQuery(`
  WITH used_paths AS (
    SELECT DISTINCT img->>'serverMediaPath' as media_path
    FROM projects p,
      jsonb_each(p.data->'screensByCanvasSize') as canvas_size,
      jsonb_array_elements(canvas_size.value) as screen_elem,
      jsonb_array_elements(screen_elem->'images') as img
    WHERE p.deleted_at IS NULL
      AND img->>'serverMediaPath' IS NOT NULL

    UNION

    SELECT DISTINCT screen_elem->'canvasSettings'->>'canvasBackgroundMediaPath' as media_path
    FROM projects p,
      jsonb_each(p.data->'screensByCanvasSize') as canvas_size,
      jsonb_array_elements(canvas_size.value) as screen_elem
    WHERE p.deleted_at IS NULL
      AND screen_elem->'canvasSettings'->>'canvasBackgroundMediaPath' IS NOT NULL
  )
  SELECT
    (SELECT COUNT(*) FROM media_assets) as total_in_db,
    (SELECT COUNT(*) FROM used_paths) as used_in_projects,
    (SELECT COUNT(*) FROM media_assets WHERE path NOT IN (SELECT media_path FROM used_paths WHERE media_path IS NOT NULL)) as orphaned;
`));

// 7. Projects summary
console.log('\n📱 Projects Summary\n');
console.log(runQuery(`
  SELECT
    name,
    jsonb_object_keys(data->'screensByCanvasSize') as canvas_size,
    jsonb_array_length(data->'screensByCanvasSize'->jsonb_object_keys(data->'screensByCanvasSize')) as screens
  FROM projects
  WHERE deleted_at IS NULL
  ORDER BY name, canvas_size;
`));

console.log('\n' + '='.repeat(50));
console.log('✅ Health check complete\n');
