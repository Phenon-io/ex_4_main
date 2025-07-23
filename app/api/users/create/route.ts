import { NextResponse } from "next/server";
import { addMinutes } from 'date-fns'
import prisma from "@/prisma/prisma";



//user lease time in minutes
const leaseTime = 60;

// user lease time conversion to days, update first integer for day count.
// const leaseTime = 1 * 60 * 24;


export async function POST(request: Request) {
    try{
        const { name } = await request.json();
        const expiresAt = addMinutes(new Date(), leaseTime)
        const user = await prisma.user.create({
            data: {
                name,
                leaseEnd: expiresAt,
            }
        })
        return NextResponse.json({user}, {status: 201});
    }
    catch(err){
        console.log(err);
        return NextResponse.json({message: 'User registration failure'}, {status: 500})
    }
    

}