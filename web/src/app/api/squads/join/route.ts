import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const joinSquadSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { inviteCode } = joinSquadSchema.parse(body);

    const squad = await db.squad.findUnique({
      where: {
        inviteCode,
      },
    });

    if (!squad) {
      return new NextResponse("Squad not found", { status: 404 });
    }

    const existingMember = await db.squadMember.findFirst({
      where: {
        squadId: squad.id,
        userId: session.user.id,
      },
    });

    if (existingMember) {
      return new NextResponse("Already a member", { status: 409 });
    }

    await db.squadMember.create({
      data: {
        squadId: squad.id,
        userId: session.user.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json(squad);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("SQUAD_JOIN_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
