/**
 * Projects API - Single Project Operations
 *
 * GET /api/projects/:id - Fetch full project with data
 * PUT /api/projects/:id - Upsert with optimistic concurrency (baseRevision)
 * DELETE /api/projects/:id - Tombstone deletion (sync-friendly)
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/:id
 * Fetch full project including data payload
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

/**
 * PUT /api/projects/:id
 * Upsert project with optimistic concurrency control
 *
 * Request body:
 * - name: string
 * - data: unknown (project payload)
 * - baseRevision: number (client's last synced revision, or 0 for new)
 *
 * Returns:
 * - 200: { id, revision, updatedAt } on success
 * - 409: { server: {...} } on conflict (baseRevision mismatch)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, data, baseRevision = 0 } = body;

  if (!name || !data) {
    return NextResponse.json(
      { error: 'Missing required fields: name, data' },
      { status: 400 }
    );
  }

  // Check current state
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  const now = new Date().toISOString();

  // Case 1: New project (no existing record)
  if (!existing) {
    if (baseRevision !== 0) {
      // Client thinks there's a server version but there isn't
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

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

    return NextResponse.json(created);
  }

  // Case 2: Existing project - check revision for optimistic concurrency
  if (existing.revision !== baseRevision) {
    // Conflict: server has different version
    return NextResponse.json(
      {
        error: 'Conflict',
        code: 'CONFLICT',
        server: existing,
      },
      { status: 409 }
    );
  }

  // Case 3: Revision matches - accept the write
  const newRevision = existing.revision + 1;
  const [updated] = await db
    .update(projects)
    .set({
      name,
      data,
      revision: newRevision,
      updatedAt: now,
      deletedAt: null, // Clear tombstone if restoring
    })
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .returning({
      id: projects.id,
      revision: projects.revision,
      updatedAt: projects.updatedAt,
    });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/projects/:id
 * Tombstone deletion (sets deletedAt, doesn't hard delete)
 *
 * Request body (optional):
 * - baseRevision: number (for conflict detection)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let baseRevision = 0;
  try {
    const body = await request.json();
    baseRevision = body.baseRevision || 0;
  } catch {
    // No body or invalid JSON - proceed with baseRevision = 0
  }

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check revision if provided
  if (baseRevision !== 0 && existing.revision !== baseRevision) {
    return NextResponse.json(
      {
        error: 'Conflict',
        code: 'CONFLICT',
        server: existing,
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const newRevision = existing.revision + 1;

  const [deleted] = await db
    .update(projects)
    .set({
      deletedAt: now,
      updatedAt: now,
      revision: newRevision,
    })
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .returning({
      id: projects.id,
      revision: projects.revision,
      updatedAt: projects.updatedAt,
      deletedAt: projects.deletedAt,
    });

  return NextResponse.json(deleted);
}
