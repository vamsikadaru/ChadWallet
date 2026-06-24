import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** Follow: POST { follower, following } */
export async function POST(req: Request) {
  try {
    const { follower, following } = await req.json();
    if (!follower || !following || follower === following) {
      return NextResponse.json({ error: "Invalid follow" }, { status: 400 });
    }
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower, following },
        { onConflict: "follower,following", ignoreDuplicates: true }
      );
    if (error) {
      return NextResponse.json({ error: error.message, needsSetup: true }, { status: 200 });
    }
    return NextResponse.json({ ok: true, following: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Unfollow: DELETE ?follower=X&following=Y */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const follower = searchParams.get("follower");
    const following = searchParams.get("following");
    if (!follower || !following) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower", follower)
      .eq("following", following);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 200 });
    }
    return NextResponse.json({ ok: true, following: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
