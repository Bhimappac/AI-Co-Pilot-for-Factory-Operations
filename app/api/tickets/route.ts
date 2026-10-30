import { NextResponse } from "next/server";
import { z } from "zod";
import { listAllTickets, saveApprovedTicket } from "@/lib/tickets-store";

const createApprovedTicketSchema = z.object({
  machine: z.string().min(1, "Machine identifier is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high"]),
  sourceChunkIds: z.array(z.number()).optional().default([]),
  operatorName: z.string().min(1, "Operator name is required").default("Operator 1"),
});

export async function GET() {
  try {
    const tickets = await listAllTickets();
    return NextResponse.json({ tickets });
  } catch (err: any) {
    console.error("[GET /api/tickets] Error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve maintenance tickets", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createApprovedTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const ticket = await saveApprovedTicket(parsed.data);
    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tickets] Error:", err);
    return NextResponse.json(
      { error: "Failed to approve maintenance ticket", details: err.message },
      { status: 500 }
    );
  }
}
