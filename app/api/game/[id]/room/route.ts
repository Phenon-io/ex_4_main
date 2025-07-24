import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addMinutes } from "date-fns";

// for getting info on a room by its ID
export async function GET(){
    
}
// when lease is up or when no players are in a room, blow it up
export async function DELETE(){

}
// on user disconnect, change playercount
export async function PUT(){

}