import { NextResponse } from "next/server";
import { addMinutes } from 'date-fns'
import prisma from "@/prisma/prisma";
import { AUTH_COOKIE_NAME } from "@/app/lib/constants";


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
            name: AUTH_COOKIE_NAME,
            value: user.id,
            expires: expiresAt,
            httpOnly: true,
            path: '/',
        });
        return response;
    } catch(err: any) {
        // Prisma unique constraint violation for the 'name' field
        if (err?.code === 'P2002' && err?.meta?.target?.includes('name')) {
            return NextResponse.json({ message: 'Username is already taken.' }, { status: 409 });
        }

        console.error("User creation error:", err);
        return NextResponse.json({ message: 'User registration failed due to a server error.' }, { status: 500 });
    }

}