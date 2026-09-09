import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/snapshot";
import { localAnswer, callLLM, hasLLM, configuredLLMProvider, DISCLAIMER, type ChatMessage } from "@/lib/assistant";

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[]; allowCloud?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((message) => ({ ...message, content: message.content.slice(0, 4_000) }));
  if (messages.reduce((total, message) => total + message.content.length, 0) > 20_000) {
    return NextResponse.json({ error: "Conversation is too long. Start a new question." }, { status: 413 });
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "No question provided" }, { status: 400 });
  }

  const snapshot = await buildSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      reply: "Finish setting up your household first, then I can answer questions about your finances.",
    });
  }

  let answer: string | null = null;
  let mode: "local" | "cloud" = "local";
  let provider: string | null = null;
  if (body.allowCloud === true && hasLLM()) {
    answer = await callLLM(messages, snapshot);
    if (answer) {
      mode = "cloud";
      provider = configuredLLMProvider();
    }
  }
  if (!answer) {
    answer = localAnswer(lastUser.content, snapshot);
  }

  return NextResponse.json({ reply: `${answer}\n\n${DISCLAIMER}`, mode, provider });
}
