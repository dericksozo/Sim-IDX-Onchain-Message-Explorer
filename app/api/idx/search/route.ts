import { NextResponse } from "next/server"

const API_BASE_URL = process.env.IDX_API_BASE ?? "https://82a2d64a59-1370591b-d.idx.dune.com"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const content = searchParams.get("content")
  if (!content) {
    return NextResponse.json({ error: "'content' query param required" }, { status: 400 })
  }

  const limit = searchParams.get("limit") ?? "10"
  const offset = searchParams.get("offset") ?? "0"

  const encoded = encodeURIComponent(content)
  const externalRes = await fetch(
    `${API_BASE_URL}/search-messages?content=${encoded}&limit=${limit}&offset=${offset}`,
  )
  const data = await externalRes.json()

  return NextResponse.json(data, { status: externalRes.status })
} 