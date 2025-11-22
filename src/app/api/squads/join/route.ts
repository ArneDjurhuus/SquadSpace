import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const joinSquadSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { inviteCode } = joinSquadSchema.parse(body);

    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (squadError || !squad) {
      return new NextResponse("Squad not found", { status: 404 });
    }

    const { data: existingMember } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', squad.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return new NextResponse("Already a member", { status: 409 });
    }

    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: "MEMBER",
      });

    if (joinError) {
      console.error("SQUAD_JOIN_ERROR", joinError);
      return new NextResponse("Failed to join squad", { status: 500 });
    }

    return NextResponse.json(squad);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("SQUAD_JOIN_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
