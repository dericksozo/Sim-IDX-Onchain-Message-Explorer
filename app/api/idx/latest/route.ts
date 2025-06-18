import { NextResponse } from "next/server"

const API_BASE_URL = process.env.IDX_API_BASE ?? "https://book.idx.dune.com"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get("limit") ?? "10"
  const offset = searchParams.get("offset") ?? "0"

  const externalRes = await fetch(`${API_BASE_URL}/latest-messages?limit=${limit}&offset=${offset}`)
  const data = await externalRes.json()
  console.log("latest-messages", data);
  return NextResponse.json(data, { status: externalRes.status })
} 