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
    
    // make or join a game
    if(process.env.GAME_BROWSER !== "true"){
        let game;
        const openGame = await prisma.gameSession.findFirst({
            where: {
                userCount: {
                    lt: 2
                }
            },
            include: {
                users: {
                    select: { id: true }
                }
            }
        });

        if (openGame) {
            // An open game exists, so join it.
            // The first user in the list is the one who created the game.
            const firstPlayerId = openGame.users[0]?.id;
            game = await prisma.gameSession.update({
                where: {
                    id: openGame.id
                },
                data: {
                    users: {
                        connect: { id: userId }
                    },
                    userCount: {
                        increment: 1
                    },
                    // Start the game by setting the current player.
                    currentPlayerId: firstPlayerId,
                }
            });
        } else {
            // No open games, so create a new one.
            game = await prisma.gameSession.create({
                data: {
                    users: { connect: { id: userId } },
                    userCount: 1,
                    expiresAt: addMinutes(new Date(), Number(process.env.GAME_LEASE_TIME || 3600))
                },
            });
        }
        return NextResponse.json({ game, userId });
    }
    // Game browser exists? Then we care about the below
    else{
        console.log("I haven't implemented the game browser so you really shouldn't be seeing this.")
    }

}