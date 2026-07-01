// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";
import { dbQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const result = await dbQuery(
      'SELECT id, role, content FROM "ChatMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" ASC',
      [sessionId]
    );

    return NextResponse.json({ history: result.rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, fileId, sessionId } = await req.json();

    if (!message || !fileId || !sessionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await dbQuery(
      'INSERT INTO "ChatMessage" (id, "fileId", "sessionId", role, content, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [crypto.randomUUID(), fileId, sessionId, "user", message]
    );

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const pc = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pc.index("nexus");

    const staticVector = new Array(1024).fill(0.1);

    const queryResponse = await pineconeIndex.namespace(fileId).query({
      vector: staticVector,
      topK: 10,
      includeMetadata: true,
    });

    const context = queryResponse.matches
      ?.map((m) => m.metadata?.text)
      .filter(Boolean)
      .join("\n\n") || "";

    const conversationHistory = await dbQuery(
      'SELECT role, content FROM "ChatMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" DESC LIMIT 6',
      [sessionId]
    );
    const formattedHistory = conversationHistory.rows.reverse();

const response = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    { 
      role: "system", 
      content: `You are Nexus AI, a strict document assistant. 

CRITICAL RULES:
1. Answer the user's query ONLY and ONLY based on the provided [CONTEXT].
2. If the answer to the user's question cannot be found directly in the [CONTEXT], or if the question is unrelated to the PDF document, you must politely decline to answer. 
3. Do NOT use your pre-trained general knowledge or logical inference to answer out-of-context questions.
4. If you cannot find the answer in the context, respond exactly with: "I can only answer questions related to the uploaded PDF. Your question is not related to this document." (or in the language the user is asking, but keep the excuse strict).

[CONTEXT]
${context}` 
    },
    ...formattedHistory,
    { role: "user", content: message },
  ],
  temperature: 0.1, // Temperature ko 0.3 se kam karke 0.1 kar dein taake model bilkul accurate rahe aur "hallucinate" na kare
});

    const aiAnswer = response.choices[0]?.message?.content || "No response generated.";

    await dbQuery(
      'INSERT INTO "ChatMessage" (id, "fileId", "sessionId", role, content, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [crypto.randomUUID(), fileId, sessionId, "assistant", aiAnswer]
    );

    return NextResponse.json({ text: aiAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}