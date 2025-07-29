import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import { AUTH_COOKIE_NAME } from '@/app/lib/constants';

/**
 * Deletes a user from the database and handles any related game session updates.
 * @param userId The ID of the user to delete.
 */
async function deleteUserFromDb(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { gameSessionId: true }
        });

        if (!user) {
            return;
        }

        if (user.gameSessionId) {
            await tx.gameSession.update({
                where: { id: user.gameSessionId },
                data: {
                    userCount: {
                        decrement: 1
                    },
                }
            });
        }
        await tx.user.delete({ where: { id: userId } });
    });
}

export async function POST() {
    const cookieStore = cookies();
    const userIdCookie = (await cookieStore).get(AUTH_COOKIE_NAME);

    if (userIdCookie?.value) {
        try {
            await deleteUserFromDb(userIdCookie.value);
            (await cookieStore).delete(AUTH_COOKIE_NAME);
            return NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });
        } catch (error) {
            console.error('Logout error:', error);
            return NextResponse.json({ message: 'An error occurred on the server during logout.' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'No active session found.' }, { status: 200 });
}

