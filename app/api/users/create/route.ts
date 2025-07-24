import { NextResponse } from "next/server";
import { addMinutes } from 'date-fns'
import prisma from "@/prisma/prisma";


export async function POST(request: Request) {
    try{
        const { name } = await request.json();
        const expiresAt = addMinutes(new Date(), Number(process.env.LEASE_TIME || 60))
        const user = await prisma.user.create({
            data: {
                name,
                leaseEnd: expiresAt,
            }
        })
        const response = NextResponse.json({user}, {status: 201});
        response.cookies.set({
            name: 'user-id',
            value: user.id,
            expires: expiresAt,
            httpOnly: true,
            path: '/',
        });
        return response;
    }
    catch(err){
        console.log(err);
        return NextResponse.json({message: 'User registration failure'}, {status: 500})
    }
    

}