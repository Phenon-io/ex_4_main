import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { error } from "console";
import { addMinutes } from "date-fns";

export async function POST(){
    var userId:string = "";
    try{
        const res = await fetch('/api/users/check',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if(res.ok){
            const data = await res.json();
            userId = data.id;
        }
        else{
            console.error("User check failed")
        }

    } catch(err){
        console.log(err);
        return NextResponse.json({message: 'User room generation failure'}, {status: 500})
    }
    if(process.env.GAME_BROWSER !== "true"){
        // this is a bit messy and doesn't handle multiple games well, but could be adapted
        var game = await prisma.gameSession.findFirst()
        if(!game) game = await prisma.gameSession.create({
            data: {
                users: {
                    connect: {
                        id: userId
                    }
                },
                userCount: 1,
                expiresAt: addMinutes(new Date(), Number(process.env.GAME_LEASE_TIME || 3600))
            },
        });
        if(game?.userCount >= 2) return null;
        const updatedRoom = await prisma.gameSession.update({
            where: {
                id: game?.id
            },
            data: {
                users: {
                    connect: {
                        id: userId
                    }
                },
                userCount: {
                    increment: 1
                }
            }
        })
        return NextResponse.json(updatedRoom);
    }
    else{
        console.log("I haven't implemented the game browser so you really shouldn't be seeing this.")
    }

}