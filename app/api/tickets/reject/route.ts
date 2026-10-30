import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRejectedTicket } from "@/lib/tickets-store";

const rejectTicketSchema = z.object({
  machine: z.string().min(1, "Machine identifier is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default("Draft rejected by operator"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  sourceChunkIds: z.array(z.number()).optional().default([]),
  operatorName: z.string().optional().default("Operator 1"),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = rejectTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const ticket = await saveRejectedTicket(parsed.data);
    return NextResponse.json({ success: true, ticket }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/tickets/reject] Error:", err);
    return NextResponse.json(
      { error: "Failed to record rejected ticket", details: err.message },
      { status: 500 }
    );
  }
}
