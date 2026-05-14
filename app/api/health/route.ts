import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-resume-builder",
    stage: "phase-1"
  });
}
