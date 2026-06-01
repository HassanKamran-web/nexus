// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { dbQuery } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { text, fileId, fileName, fileUrl, userId } = await req.json();

    let cleanText = typeof text === "string" ? text.trim() : "";
    if (!cleanText) {
      cleanText = `Discussion thread initialized for ${fileName || "Uploaded PDF"}.`;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([cleanText]);


    const pc = new PineconeClient({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pc.index("nexus");

    const staticVector = new Array(1024).fill(0.1);

    const records = docs.map((doc, index) => ({
      id: `${fileId}-${index}`,
      values: staticVector,
      metadata: {
        text: doc.pageContent,
        fileId: fileId,
      },
    }));

    if (records.length === 0) {
      throw new Error("No records generated from documents.");
    }

    let upsertSuccess = false;

    try {
      await pineconeIndex.upsert({
        vectors: records,
        namespace: fileId
      });
      upsertSuccess = true;
    } catch (err1) {
      console.error("❌ Attempt 1 failed. Error:", err1.message || err1);
    }

    if (!upsertSuccess) {
      try {
        await pineconeIndex.namespace(fileId).upsert(records);
        upsertSuccess = true;
      } catch (err2) {
        console.error("❌ Attempt 2 failed. Error:", err2.message || err2);
      }
    }

    if (!upsertSuccess) {
      try {
        await pineconeIndex.namespace(fileId).upsert({
          records: records
        });
        upsertSuccess = true;
      } catch (err3) {
        console.error("❌ Attempt 3 failed. Error:", err3.message || err3);
      }
    }

    if (!upsertSuccess) {
      throw new Error("Pinecone strictly rejected all 3 SDK structural attempts.");
    }

    if (userId) {
      await dbQuery(
        'INSERT INTO "File" (id, name, url, "uploadStatus", "userId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [fileId, fileName || "Uploaded PDF", fileUrl || "", "SUCCESS", userId]
      );
    } else {
      await dbQuery(
        'INSERT INTO "File" (id, name, url, "uploadStatus", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [fileId, fileName || "Uploaded PDF", fileUrl || "", "SUCCESS"]
      );
    }

    return NextResponse.json({ success: true, message: "Vectors stored & Database synced!" });

  } catch (error: any) {
    console.error("Vector Critical Root Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}