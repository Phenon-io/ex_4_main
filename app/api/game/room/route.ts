import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addMinutes } from "date-fns";
import { AUTH_COOKIE_NAME } from "@/app/lib/constants";


export async function POST(){
    // Update user lease and snag their uid
    const cookieStore = cookies();
    const userIdCookie = (await cookieStore).get(AUTH_COOKIE_NAME);
    const userId = userIdCookie?.value;
    if(!userId) return NextResponse.redirect(new URL('/'))

    try{
        const leaseUpdate = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                leaseEnd: addMinutes(new Date(), Number(process.env.LEASE_TIME || 60))
            }
        })
        if(!leaseUpdate){
            console.error("Failed to update user lease");
        } 
    }catch(err){
        console.error(err);
    }

    
    
    const existingSession = await prisma.gameSession.findFirst({
        where: {
            users: { some: { id: userId } },
            userCount: { lt: 2 },
        },
    });

    if (existingSession) {
        return NextResponse.json({ game: existingSession, userId });
    }

    // Otherwise, try to find an open game
    const openGame = await prisma.gameSession.findFirst({
        where: {
            userCount: { gt: 0, lt: 2 },
            users: {
                none: { id: userId } // Don’t join own game
            }
        },
        include: {
            users: {
                select: { id: true }
            }
        }
    });

    let game;
    
    if (openGame) {
        let firstPlayerId = openGame.users[0].id;
        game = await prisma.gameSession.update({
            where: { id: openGame.id },
            data: {
                users: { connect: { id: userId } },
                userCount: { increment: 1 },
                currentPlayerId: firstPlayerId,
            }
        });
    } else {
        // No open games, so create one
        

        game = await prisma.gameSession.create({
            data: {
                users: { connect: { id: userId } },
                userCount: 1,
                expiresAt: addMinutes(new Date(), Number(process.env.GAME_LEASE_TIME || 3600)),
                currentPlayerId: userId,
                oddTurn: true
            }
        });
    }

    return NextResponse.json({ game, userId });
}