import prisma from "@/prisma/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/app/lib/constants";

export async function POST() {
    const cookieStore = cookies();
    const userIdCookie = (await cookieStore).get(AUTH_COOKIE_NAME);
    const userId = userIdCookie?.value;
    if (!userId) return NextResponse.json({ success: false });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { game: true }
        });

        if (!user) return NextResponse.json({ success: false });

        await prisma.gameSession.updateMany({
            where: {
                users: { some: { id: userId } },
                userCount: { lt: 2 }
            },
            data: {
                users: { disconnect: { id: userId } },
                userCount: { decrement: 1 }
            }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Disconnect error:", err);
        return NextResponse.json({ success: false });
    }
}
