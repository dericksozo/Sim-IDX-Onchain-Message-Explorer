import { NextResponse } from "next/server"

const API_BASE_URL = process.env.IDX_API_BASE ?? "https://82a2d64a59-1370591b-d.idx.dune.com"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get("limit") ?? "10"
  const offset = searchParams.get("offset") ?? "0"
  const chainIds = searchParams.get("chainIds") // optional comma-separated list

  const qs = `limit=${limit}&offset=${offset}${chainIds ? `&chainIds=${chainIds}` : ""}`

  const externalRes = await fetch(`${API_BASE_URL}/latest-messages?${qs}`)
  const data = await externalRes.json()
  console.log("latest-messages", data)
  return NextResponse.json(data, { status: externalRes.status })
} 