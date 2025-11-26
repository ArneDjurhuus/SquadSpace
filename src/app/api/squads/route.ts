import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const createSquadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(['GAMING', 'STUDY', 'STARTUP', 'CREATIVE', 'SPORTS', 'BOOK_CLUB', 'FITNESS', 'OTHER']).default('OTHER'),
  isPrivate: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, type, isPrivate } = createSquadSchema.parse(body);

    // 1. Create Squad
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({
        name,
        description,
        type,
        is_private: isPrivate,
        owner_id: user.id,
        settings: {},
      })
      .select()
      .single();

    if (squadError) {
      console.error("SQUAD_CREATION_DB_ERROR", squadError);
      return new NextResponse("Database Error", { status: 500 });
    }

    // 2. Add Creator as Leader
    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'LEADER',
      });

    if (memberError) {
      console.error("SQUAD_MEMBER_CREATION_ERROR", memberError);
      // Ideally rollback squad creation here, but for MVP we'll just log
      return new NextResponse("Member Creation Error", { status: 500 });
    }

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get squads where the user is a member
    const { data: squads, error } = await supabase
      .from('squads')
      .select(`
        *,
        squad_members!inner(user_id)
      `)
      .eq('squad_members.user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("SQUADS_FETCH_ERROR", error);
      return new NextResponse("Database Error", { status: 500 });
    }

    return NextResponse.json(squads);
  } catch (error) {
    console.error("SQUADS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
