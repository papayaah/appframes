/**
 * Projects API - List and Create
 *
 * GET /api/projects - List user's projects (lightweight, no data field)
 * POST /api/projects - Create new project (used for "claim local projects" on sign-in)
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and, isNull, desc } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';

/**
 * GET /api/projects
 * Returns lightweight list of user's projects for "My Projects" view
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get('includeDeleted') === '1';

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      revision: projects.revision,
      updatedAt: projects.updatedAt,
      deletedAt: projects.deletedAt,
    })
    .from(projects)
    .where(
      includeDeleted
        ? eq(projects.userId, session.user.id)
        : and(eq(projects.userId, session.user.id), isNull(projects.deletedAt))
    )
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json(userProjects);
}

/**
 * POST /api/projects
 * Create a new project (used during "claim local projects" flow)
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, data } = body;

  if (!id || !name || !data) {
    return NextResponse.json(
      { error: 'Missing required fields: id, name, data' },
      { status: 400 }
    );
  }

  // Check if project already exists for this user
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Project already exists', code: 'PROJECT_EXISTS' },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const [created] = await db
    .insert(projects)
    .values({
      id,
      userId: session.user.id,
      name,
      data,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: projects.id,
      revision: projects.revision,
      updatedAt: projects.updatedAt,
    });

  return NextResponse.json(created, { status: 201 });
}
