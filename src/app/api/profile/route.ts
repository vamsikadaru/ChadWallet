import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { handleFromAddress } from "@/lib/handle";
import { requireAuth } from "@/lib/auth-server";

interface ProfileRow {
  wallet_address: string;
  handle: string;
  username: string | null;
  bio: string | null;
  avatar_seed: string | null;
  is_seed: boolean;
  created_at: string;
}

function synthesize(wallet: string): ProfileRow {
  return {
    wallet_address: wallet,
    handle: handleFromAddress(wallet),
    username: null,
    bio: null,
    avatar_seed: wallet,
    is_seed: false,
    created_at: new Date().toISOString(),
  };
}

async function countFollows(column: "follower" | "following", value: string) {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  return count ?? 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const viewer = searchParams.get("viewer") ?? "";

  try {
    // Top-traders list: seeded profiles + follower counts + isFollowing(viewer).
    if (searchParams.get("top")) {
      const { data: seeds } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_seed", true);
      const list = (seeds as ProfileRow[]) ?? [];

      const { data: edges } = await supabase
        .from("follows")
        .select("follower, following")
        .in(
          "following",
          list.map((s) => s.wallet_address)
        );
      const followerCounts: Record<string, number> = {};
      const viewerFollows = new Set<string>();
      for (const e of (edges as { follower: string; following: string }[]) ?? []) {
        followerCounts[e.following] = (followerCounts[e.following] ?? 0) + 1;
        if (e.follower === viewer) viewerFollows.add(e.following);
      }

      return NextResponse.json({
        traders: list
          .map((p) => ({
            ...p,
            followers: followerCounts[p.wallet_address] ?? 0,
            isFollowing: viewerFollows.has(p.wallet_address),
          }))
          .sort((a, b) => b.followers - a.followers),
      });
    }

    // Single profile view.
    const wallet = searchParams.get("wallet") ?? "";
    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const { data: row } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", wallet)
      .maybeSingle();

    const profile = (row as ProfileRow) ?? synthesize(wallet);

    const [followers, following] = await Promise.all([
      countFollows("following", wallet),
      countFollows("follower", wallet),
    ]);

    let isFollowing = false;
    if (viewer && viewer !== wallet) {
      const { data: edge } = await supabase
        .from("follows")
        .select("follower")
        .eq("follower", viewer)
        .eq("following", wallet)
        .maybeSingle();
      isFollowing = !!edge;
    }

    return NextResponse.json({ profile, followers, following, isFollowing });
  } catch {
    // Tables not set up yet — degrade gracefully.
    const wallet = searchParams.get("wallet") ?? "";
    return NextResponse.json({
      profile: wallet ? synthesize(wallet) : null,
      followers: 0,
      following: 0,
      isFollowing: false,
      traders: [],
      needsSetup: true,
    });
  }
}

export async function POST(req: Request) {
  const did = await requireAuth(req);
  if (!did) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const wallet: string = body.wallet_address;
    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet_address" }, { status: 400 });
    }

    const isEdit =
      body.username !== undefined || body.bio !== undefined;

    if (!isEdit) {
      // "Ensure exists" — insert if missing, never clobber an existing profile.
      const { error } = await supabase.from("profiles").upsert(
        {
          wallet_address: wallet,
          handle: handleFromAddress(wallet),
          avatar_seed: wallet,
        },
        { onConflict: "wallet_address", ignoreDuplicates: true }
      );
      if (error) {
        return NextResponse.json({ profile: synthesize(wallet), needsSetup: true });
      }
    } else {
      // Profile edit — update only the editable fields.
      const patch: Record<string, unknown> = {
        wallet_address: wallet,
        handle: handleFromAddress(wallet),
        avatar_seed: wallet,
      };
      if (body.username !== undefined) patch.username = body.username;
      if (body.bio !== undefined) patch.bio = body.bio;
      const { error } = await supabase
        .from("profiles")
        .upsert(patch, { onConflict: "wallet_address" });
      if (error) {
        return NextResponse.json({ profile: synthesize(wallet), needsSetup: true });
      }
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", wallet)
      .maybeSingle();
    return NextResponse.json({ profile: data ?? synthesize(wallet) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
