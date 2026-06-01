import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const pdf = require("pdf-parse-fork");

export async function POST(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();

    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const data = await pdf(buffer);


    return NextResponse.json({ 
      text: data.text,
      pageCount: data.numpages 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}