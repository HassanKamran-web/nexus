// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbQuery } from "@/lib/db";

async function getLoggedUserId() {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) return null;

  const userRes = await dbQuery('SELECT id FROM "User" WHERE email = $1', [email]);
  return userRes.rows[0]?.id || null;
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    
    const dbUserId = await getLoggedUserId();
    if (!dbUserId) {
      return NextResponse.json({ sessions: [], message: "Unauthorized access" }, { status: 401 });
    }

    if (fileId) {
      try {
        const checkFile = await dbQuery(
          'SELECT id FROM "ChatSession" WHERE "fileId" = $1 AND "userId" = $2', 
          [fileId, dbUserId]
        );
        
        if (checkFile.rows.length === 0) {
          const fileResult = await dbQuery('SELECT name FROM "File" WHERE id = $1', [fileId]);
          const pdfName = fileResult.rows[0]?.name || "New PDF Chat";

          await dbQuery(
            'INSERT INTO "ChatSession" (id, "fileId", title, "userId", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
            [crypto.randomUUID(), fileId, pdfName, dbUserId]
          );
        }
      } catch (colError) {
        const checkFileFallback = await dbQuery(
          'SELECT id FROM "ChatSession" WHERE "fileId" = $1 AND "userId" = $2', 
          [fileId, dbUserId]
        );
        if (checkFileFallback.rows.length === 0) {
          const fileResult = await dbQuery('SELECT name FROM "File" WHERE id = $1', [fileId]);
          const pdfName = fileResult.rows[0]?.name || "New PDF Chat";
          await dbQuery(
            'INSERT INTO "ChatSession" (id, "fileId", title, "userId", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
            [crypto.randomUUID(), fileId, pdfName, dbUserId]
          );
        }
      }
    }

    const result = await dbQuery(
      'SELECT id, "fileId", title, "createdAt" FROM "ChatSession" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [dbUserId]
    );
    return NextResponse.json({ sessions: result.rows });

  } catch (error) {
    console.error("Session GET Error:", error);
    return NextResponse.json({ error: "Failed to handle sessions" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, title } = await req.json();
    const dbUserId = await getLoggedUserId();

    if (!sessionId || !title) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
      await dbQuery(
        'UPDATE "ChatSession" SET title = $1 WHERE id = $2 AND "userId" = $3',
        [title, sessionId, dbUserId]
      );
    } catch (e) {
      await dbQuery(
        'UPDATE "ChatSession" SET title = $1 WHERE id = $2',
        [title, sessionId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to rename session" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await dbQuery('DELETE FROM "ChatMessage" WHERE "sessionId" = $1', [sessionId]);
    await dbQuery('DELETE FROM "ChatSession" WHERE id = $1', [sessionId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}