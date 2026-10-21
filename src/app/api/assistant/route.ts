import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/snapshot";
import { localAnswer, callLLM, hasLLM, DISCLAIMER, type ChatMessage } from "@/lib/assistant";

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
  let cloudNote = "";
  if (body.allowCloud === true) {
    if (!hasLLM()) {
      cloudNote = "Cloud AI is on, but the server has no API key. Check .env.local (or Vercel variables) and restart.";
    } else {
      const llm = await callLLM(messages, snapshot);
      if (llm.text) {
        answer = llm.text;
        mode = "cloud";
        provider = llm.provider;
      } else {
        cloudNote = `Cloud AI did not answer (${llm.error}). Showing the local answer instead.`;
      }
    }
  }
  if (!answer) {
    answer = localAnswer(lastUser.content, snapshot);
  }
  if (cloudNote) answer = `${answer}\n\n${cloudNote}`;

  return NextResponse.json({ reply: `${answer}\n\n${DISCLAIMER}`, mode, provider });
}
