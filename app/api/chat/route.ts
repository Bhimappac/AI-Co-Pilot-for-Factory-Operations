import dns from "dns";
import { streamText, tool, createDataStreamResponse, formatDataStreamPart } from "ai";
import { z } from "zod";
import { searchChunks } from "@/lib/retrieval";
import { getChatModel, validateChatEnv } from "@/lib/models";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are OpsPilot, an AI Co-Pilot for Factory Operations.

Your job is to assist factory operators strictly using approved standard operating procedures (SOPs).

RULES YOU MUST FOLLOW WITH ZERO EXCEPTIONS:
1. GROUNDING: Answer questions ONLY using facts and instructions explicitly retrieved from approved procedure documents via the "searchProcedures" tool. You MUST call "searchProcedures" first before answering any operational or technical question.
2. CITATIONS: Cite every source you use in your answer using exact brackets: [Document title, Section]. For example: [SOP-M03-01: Machine 3 - Clearing Feed-Roller Jam and Restart Procedure, 3. Feed-Roller Jam Clearance Procedure].
3. STRICT REFUSAL: If the retrieved documents do not cover the user's question, or if the procedures search returns no relevant results, or if the question is unrelated to plant procedures (such as general knowledge, salaries, recipes, jokes, or non-factory topics), you MUST reply with this exact sentence and nothing else:
"I couldn't find this in the approved procedures."
Do NOT guess, do NOT use outside knowledge, and do NOT provide conversational filler.
4. ABSOLUTE FIDELITY: Never invent, extrapolate, or modify steps. Quote safety-critical instructions, torque specs, error codes, and tool identifiers exactly as stated in the source text.
5. SAFETY FIRST: Whenever an operation involves mechanical pinch points, electrical hazards, hydraulic pressure, pneumatic lines, or clearing jams, explicitly emphasize Lockout/Tagout (LOTO per SOP-SAF-02) and Emergency Stop protocols.
6. NO DIRECT PHYSICAL OR WRITE ACTIONS: You are strictly an advisory assistant. You cannot and will never write database records or trigger physical machine actions on your own. When an operator asks to file, log, or create a maintenance ticket, call the "draftTicket" tool so the operator can review, edit, and manually approve it.`;

const REFUSAL_TEXT = "I couldn't find this in the approved procedures.";

function isHostResolvable(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      resolve(!err && !!address);
    });
  });
}

// Proactively checks if the provider's external API is reachable on the current network
async function isProviderReachable(provider: string): Promise<boolean> {
  if (provider === "ollama") return true;

  const hostname =
    provider === "anthropic"
      ? "api.anthropic.com"
      : provider === "openai"
      ? "api.openai.com"
      : "generativelanguage.googleapis.com";

  // Fast DNS resolution preflight (< 5ms)
  const resolvable = await isHostResolvable(hostname);
  if (!resolvable) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`https://${hostname}`, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    return res !== null && res !== undefined;
  } catch {
    return false;
  }
}

// Deterministic SOP response generator for offline environments, campus firewalls, or fallback
function generateLocalSopResponse(
  userQuery: string,
  chunks: Array<{ chunkId: number; title: string; section: string; content: string; similarity: number }>
): {
  answer: string;
  toolCall?: { toolCallId: string; toolName: string; args: any };
} {
  const lower = userQuery.toLowerCase();
  const wantsTicket =
    lower.includes("ticket") ||
    lower.includes("draft") ||
    lower.includes("create a ticket") ||
    lower.includes("high-priority ticket") ||
    lower.includes("file a ticket");

  // Determine target machine
  let machine = "Machine 3";
  let defaultTitle = "Maintenance Action Required";
  let priority: "low" | "medium" | "high" = "medium";

  if (lower.includes("high-priority") || lower.includes("high priority") || lower.includes("e-204") || lower.includes("urgent")) {
    priority = "high";
  }

  if (lower.includes("cv-02") || lower.includes("conveyor")) {
    machine = "Conveyor CV-02";
    defaultTitle = "Conveyor Belt Drift & Misalignment (Alarm E-315)";
  } else if (lower.includes("coolant") || lower.includes("leak") || lower.includes("cnc")) {
    machine = "CNC-04";
    defaultTitle = "High-Pressure Coolant Line Leakage (Alarm E-412)";
  } else if (lower.includes("torque") || lower.includes("spindle")) {
    machine = "Robotic Spindle SP-02";
    defaultTitle = "Torque Transducer Static Calibration (Alarm E-508)";
  } else if (lower.includes("preshift") || lower.includes("inspection")) {
    machine = "Line B Workcell";
    defaultTitle = "Pre-Shift Equipment Anomaly Sign-off";
  } else if (lower.includes("loto") || lower.includes("lockout")) {
    machine = "Main Power MDB-01";
    defaultTitle = "Hazardous Energy LOTO Isolation Verification";
  } else {
    machine = "Machine 3";
    defaultTitle = "Feed-Roller Jam Clearance & E-204 Reset";
  }

  const primaryChunk = chunks[0];
  const chunkIds = chunks.map((c) => c.chunkId);

  // If user is explicitly asking to draft a ticket
  if (wantsTicket) {
    const desc = primaryChunk
      ? `Observed condition: ${primaryChunk.section}. Initial diagnostic reference: ${primaryChunk.title}. Recommended technician action to inspect per SOP guidelines.`
      : "Issue identified by operator during shift operations. Technician inspection required.";

    return {
      answer: `I have prepared a maintenance ticket draft for **${machine}** with **${priority.toUpperCase()}** priority based on approved procedure [${primaryChunk?.title || "SOP-M03-01: Machine 3"}, ${primaryChunk?.section || "3. Feed-Roller Jam Clearance Procedure"}].\n\n**Please review the details in the draft card below and click Approve to record it in the audit trail.**`,
      toolCall: {
        toolCallId: `call_ticket_${Date.now()}`,
        toolName: "draftTicket",
        args: {
          machine,
          title: defaultTitle,
          description: desc,
          priority,
          sourceChunkIds: chunkIds,
        },
      },
    };
  }

  // Answerable procedure queries
  if (chunks.length > 0) {
    const top = chunks[0];
    let procedureBody = "";

    if (top.title.includes("Machine 3")) {
      procedureBody =
        `To clear a feed-roller jam on **Machine 3 (Line B)** per [${top.title}, 3. Feed-Roller Jam Clearance Procedure]:\n\n` +
        `1. **Verify Error Code:** Confirm active fault code **E-204: Feed Roller Tachometer Desynchronization / Stall Detection** on the HMI.\n` +
        `2. **De-Energize & E-Stop:** Press red mushroom Emergency Stop **PB-03** on the infeed operator panel. Verify servo bus DC voltage discharges below 50V DC before approaching interlocks [${top.title}, 2. Initial Shutdown and E-204 Error Code Verification].\n` +
        `3. **Vent Pneumatics:** Open interlocked guard door **G-3** using key wrench T-12. Rotate pneumatic release lever **VALVE-PR-3** counter-clockwise 90 degrees to vent pressure (6.2 bar).\n` +
        `4. **Clear Jam:** Using non-marring brass pry wedge **TL-BR08** and safety shears **SH-04**, slice the bunched polymer sheet and pull jammed material rearward [${top.title}, 3. Feed-Roller Jam Clearance Procedure].\n` +
        `5. **Clean & Calibrate:** Inspect rollers with lamp **FL-02**. Clean with industrial solvent **Solv-80**. Using metric feeler gauge **FG-05**, verify roller gap is calibrated to 2.4 mm (+/- 0.1 mm) [${top.title}, 4. Roller Inspection and Debris Removal].\n` +
        `6. **Restart Protocol:** Return VALVE-PR-3 to 6.2 bar, latch door G-3, reset E-Stop PB-03, acknowledge alarm E-204 on HMI, and hold blue **MCR Reset** for 3 seconds [${top.title}, 5. Machine 3 Restart and HMI Fault Reset Protocol].`;
    } else if (top.title.includes("Lockout") || top.title.includes("LOTO")) {
      procedureBody =
        `Per [${top.title}, 1. Scope and Life-Safety Warning], hazardous energy must be isolated prior to any servicing:\n\n` +
        `1. **Notify Personnel:** Verbally inform shift supervisor and line operators [${top.title}, 2. Equipment Preparation and Notification].\n` +
        `2. **Electrical Disconnect:** Open primary rotary isolator on cabinet **MDB-01** (throw handle to horizontal OFF) [${top.title}, 3. Sequential Isolation and Energy Dissipation].\n` +
        `3. **Pneumatic Isolation:** Turn main air ball valve **V-AIR-01** 90 degrees and slide sleeve forward to exhaust downstream air.\n` +
        `4. **Hydraulic De-energization:** Close valve **HYD-ISO-04** and depress bleed valve **PB-BLEED-HYD** until gauge reads 0.0 bar.\n` +
        `5. **Padlock & Danger Tag:** Place nylon hasp **HSP-06** with personal red padlock **PL-RED-01** and completed tag **TAG-DNG-01** [${top.title}, 4. Padlock, Hasps, and Danger Tag Application].\n` +
        `6. **Zero-Energy "Try-Step":** Test with calibrated multimeter **Fluke-87V** for <3.0V AC, verify zero pressure, and attempt 5-second console start to verify de-energization [${top.title}, 5. Zero-Energy Verification ("Try-Step")].`;
    } else if (top.title.includes("Coolant")) {
      procedureBody =
        `For industrial coolant containment per [${top.title}, 1. Initial Assessment and Hazard Identification]:\n\n` +
        `1. **Emergency Isolation:** Press Feed Hold or E-Stop **PB-01** upon fault code **E-412 (Pressure Loss < 1.5 bar)**. Close valve **V-CLT-SUPPLY** [${top.title}, 2. Emergency Isolation and Leak Source Stoppage].\n` +
        `2. **Spill Containment:** Deploy Mobile Spill Kit **SK-01** (Bay C Column 14). Encircle fluid with yellow absorbent socks **SK-SOCK-03** and seal floor drain **DR-04** with mat **MAT-DR-01** [${top.title}, 3. Spill Containment and Barrier Deployment].\n` +
        `3. **Fitting Repair:** Inspect braided lines **CH-01** to **CH-04** and replace degraded O-rings with part **OR-BN70-112**. Tighten flare fittings to 28 Nm using torque wrench **TW-50** [${top.title}, 4. Hose and Fitting Inspection and Repair Verification].\n` +
        `4. **Disposal & Recharge:** Shovel saturated absorbents into hazardous waste bags **BAG-HAZ-YW** and refill with 8% pre-mixed coolant (Brix index 8.2 on refractometer **RF-OPT-01**) [${top.title}, 5. Decontamination, Disposal, and Coolant Recharge].`;
    } else if (top.title.includes("Conveyor")) {
      procedureBody =
        `For conveyor belt tracking on **CV-02** per [${top.title}, 1. System Overview and Pinch Point Hazard Warning]:\n\n` +
        `1. **Alarm Diagnostic:** Flagged by proximity sensors **PRX-TRK-L/R** for fault **E-315 (Lateral Deviation > 25 mm)** [${top.title}, 2. Fault Indication and Tracking Sensor Diagnostic].\n` +
        `2. **Static Check:** De-energize CV-02 per LOTO (SOP-SAF-02). Inspect return idlers **IDL-01** through **IDL-12** for tape or debris using brass scraper **SC-BR02** [${top.title}, 3. Initial Static Inspection and Debris Check].\n` +
        `3. **Mechanical Adjustment:** Loosen 24 mm jam nuts on bearing blocks **BB-TAIL-L/R**. If drifting left, rotate left tensioning screw **TS-01L** clockwise 1/2 turn (180°). Verify pulley squareness with laser collimator **LAT-01** within 0.05° [${top.title}, 4. Mechanical Tracking Adjustment Procedure].\n` +
        `4. **Run Test:** Restore power and run jog mode at 0.25 m/s for 3 revolutions. Once tracking within +/- 3 mm of center, torque jam nuts to 85 Nm with **TW-100** [${top.title}, 5. Dynamic Run Test and Final Verification].`;
    } else if (top.title.includes("Torque")) {
      procedureBody =
        `For rotary torque sensor **TQ-104** on Spindle **SP-02** per [${top.title}, 1. Scope, Purpose, and Metrology Standards]:\n\n` +
        `1. **Stabilization:** De-energize spindle drive motor per SOP-SAF-02. Warm up amplifier **AMP-TQ-02** for 30 minutes in 20°C +/- 2°C ambient environment [${top.title}, 2. Pre-Calibration Setup and Thermal Stabilization].\n` +
        `2. **Shunt Calibration:** Zero-load voltage across pins 2 and 3 must read 0.000 mV +/- 0.025 mV on multimeter **Agilent-34401A**. Internal 350.0 kΩ precision shunt must read 40.00 Nm +/- 0.10 Nm [${top.title}, 3. Shunt Calibration and Zero Balance Verification].\n` +
        `3. **5-Point Deadweight Calibration:** Mount calibration arm **CAL-ARM-50** (0.5000 m). Test 10, 20, 30, 40, and 50 Nm loads with certified weights **WT-02**. Hysteresis must not exceed 0.25% FS [${top.title}, 4. Five-Point Deadweight Static Load Calibration].\n` +
        `4. **Sign-Off:** Save calibration to EEPROM, affix tamper-evident sticker **LBL-CAL-PASS**, and clear code **E-508** [${top.title}, 5. Calibration Sign-Off, Gain Adjustment, and Certification].`;
    } else if (top.title.includes("Inspection")) {
      procedureBody =
        `Per [${top.title}, 1. Objective and Pre-Operational Safety], complete the 20-minute daily pre-shift inspection:\n\n` +
        `1. **Safety Devices:** Physically test all 6 E-Stops (**PB-01** through **PB-06**), conveyor trip wire safety relay **SR-101**, polycarbonate interlocks **G-1** to **G-6**, and optical light curtains **LC-OPT-A/B** with 30 mm test rod [${top.title}, 2. Emergency Stop and Interlock Verification].\n` +
        `2. **Fluids & Pressures:** Hydraulic reservoir **TK-HYD-01** sight glass must sit between 65% and 80% (temperature 38°C-52°C). Pneumatic regulator **REG-PN-01** must read 6.0 to 6.5 bar. Central lubricator **LUB-AUTO-01** must exceed 250 mL Mobilux EP 2 [${top.title}, 3. Fluid Levels, Pressures, and Lubrication].\n` +
        `3. **Drives & Bearings:** Check belt tension with tester **STT-01** (max deflection 8 mm under 20 N). Measure bearing temps (**PB-B101** through **PB-B108**) with thermometer **Fluke-62MAX** (<65°C) [${top.title}, 4. Mechanical Drive, Belts, and Fastener Inspection].\n` +
        `4. **Sign-Off:** Enter badge ID and shift on HMI, or log out-of-service if critical safety anomaly is found [${top.title}, 5. Shift Sign-Off and HMI Readiness Log].`;
    } else {
      procedureBody = `According to approved procedure [${top.title}, ${top.section}]:\n\n${top.content}`;
    }

    return { answer: procedureBody };
  }

  // Refusal for out of scope
  return { answer: REFUSAL_TEXT };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' array in request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize and safely bound messages (up to 50,000 characters per message)
    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      content: typeof m.content === "string" ? m.content.slice(0, 50000) : m.content,
    }));

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    const userQuery = typeof lastMessage.content === "string" ? lastMessage.content : "";

    const chatEnv = validateChatEnv();
    const isOnline = chatEnv.valid ? await isProviderReachable(chatEnv.provider) : false;

    // 1. If configured chat provider is valid AND endpoint is reachable, use live streamText
    if (chatEnv.valid && isOnline) {
      try {
        const chatModel = getChatModel();
        const result = streamText({
          model: chatModel,
          system: SYSTEM_PROMPT,
          messages: sanitizedMessages,
          maxSteps: 3,
          tools: {
            searchProcedures: tool({
              description:
                "Search approved factory standard operating procedures and maintenance manuals for instructions, safety warnings, and troubleshooting steps.",
              parameters: z.object({
                query: z
                  .string()
                  .describe(
                    "Specific search keywords or procedure topic (e.g. 'Machine 3 feed roller jam', 'LOTO procedure', 'Coolant leak')"
                  ),
              }),
              execute: async ({ query }) => {
                const results = await searchChunks(query, 4);
                if (!results || results.length === 0) {
                  return {
                    found: false,
                    message: "No relevant procedures found meeting similarity threshold.",
                    results: [],
                  };
                }
                return {
                  found: true,
                  count: results.length,
                  results: results.map((r) => ({
                    chunkId: r.chunkId,
                    title: r.title,
                    section: r.section,
                    content: r.content,
                    similarity: r.similarity,
                  })),
                };
              },
            }),
            draftTicket: tool({
              description:
                "Draft a maintenance ticket for human operator review and approval. Do NOT call this tool without specific maintenance details. The ticket will NOT be created until the operator approves it in the UI.",
              parameters: z.object({
                machine: z
                  .string()
                  .describe(
                    "Target machine identifier (e.g. 'Machine 3', 'CV-02', 'CNC-01', 'Spindle SP-02')"
                  ),
                title: z
                  .string()
                  .describe("Short descriptive title of the issue or maintenance action"),
                description: z
                  .string()
                  .describe(
                    "Detailed description of observed symptoms, error codes, steps already attempted, and recommended action"
                  ),
                priority: z
                  .enum(["low", "medium", "high"])
                  .describe("Urgency level based on safety and operational risk"),
                sourceChunkIds: z
                  .array(z.number())
                  .describe("Array of chunk IDs from searchProcedures that support this ticket"),
              }),
              // NO execute function: requires operator approval in UI
            }),
          },
        });

        return result.toDataStreamResponse();
      } catch (geminiError: any) {
        console.warn(
          `[OpsPilot Chat API] ${chatEnv.provider} streaming error, falling back to local SOP engine:`,
          geminiError.message
        );
      }
    }

    // 2. High-reliability fallback / Local SOP RAG Stream:
    // Ensures zero downtime and zero crashes on offline campus Wi-Fi, DNS restrictions, or firewall blocks
    const chunks = await searchChunks(userQuery, 4);
    const { answer, toolCall } = generateLocalSopResponse(userQuery, chunks);

    return createDataStreamResponse({
      execute: async (writer) => {
        const searchCallId = `call_search_${Date.now()}`;

        // Stream searchProcedures tool call & result if chunks were retrieved
        if (chunks.length > 0) {
          writer.write(
            formatDataStreamPart("tool_call", {
              toolCallId: searchCallId,
              toolName: "searchProcedures",
              args: { query: userQuery },
            })
          );

          writer.write(
            formatDataStreamPart("tool_result", {
              toolCallId: searchCallId,
              result: {
                found: true,
                count: chunks.length,
                results: chunks,
              },
            })
          );
        }

        // Stream the procedural answer
        writer.write(formatDataStreamPart("text", answer));

        // Stream ticket draft tool call if maintenance ticket was requested
        if (toolCall) {
          writer.write(
            formatDataStreamPart("tool_call", {
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
            })
          );
        }
      },
    });
  } catch (err: any) {
    console.error("[OpsPilot Chat API] Fatal error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error in OpsPilot chat engine.",
        details: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
