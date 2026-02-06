/**
 * Account API - Account Deletion
 *
 * DELETE /api/account - Permanently delete user account and all associated data
 *
 * This is a destructive operation that:
 * 1. Deletes all media files from filesystem
 * 2. Deletes all database records (cascades via FK: projects, media_assets, accounts, sessions)
 * 3. Deletes the user record
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { deleteUserMediaDirectory } from '@reactkits.dev/react-media-library/server';

/**
 * DELETE /api/account
 * Permanently delete user account and all associated data
 *
 * Request body:
 * - confirmPhrase: string (must be "DELETE MY ACCOUNT" to proceed)
 */
export async function DELETE(request: Request) {
    const currentSession = await auth.api.getSession({
        headers: await headers(),
    });

    if (!currentSession?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentSession.user.id;

    // Require confirmation phrase
    let confirmPhrase = '';
    try {
        const body = await request.json();
        confirmPhrase = body.confirmPhrase;
    } catch {
        // No body or invalid JSON
    }

    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
        return NextResponse.json(
            { error: 'Confirmation required. Send { confirmPhrase: "DELETE MY ACCOUNT" }' },
            { status: 400 }
        );
    }

    try {
        // 1. Delete all media files from filesystem
        // This should happen before DB deletion since we need the file paths
        try {
            await deleteUserMediaDirectory(userId);
            console.log(`[Account Delete] Deleted media files for user ${userId}`);
        } catch (error) {
            // Log but continue - filesystem deletion failure shouldn't block account deletion
            console.error(`[Account Delete] Failed to delete media files for user ${userId}:`, error);
        }

        // 2. Delete user from database
        // FK cascades will automatically delete: projects, media_assets, accounts, sessions
        await db.delete(user).where(eq(user.id, userId));

        console.log(`[Account Delete] Deleted user ${userId} and all associated data`);

        return NextResponse.json({
            success: true,
            message: 'Account and all associated data have been permanently deleted',
        });
    } catch (error) {
        console.error(`[Account Delete] Failed to delete account for user ${userId}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}
