import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSquadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, isPrivate } = createSquadSchema.parse(body);

    const squad = await db.squad.create({
      data: {
        name,
        description,
        category,
        isPrivate,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "LEADER",
          },
        },
      },
    });

    return NextResponse.json(squad);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("SQUAD_CREATION_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const squads = await db.squad.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(squads);
  } catch (error) {
    console.error("SQUADS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
