import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function POST() {
  const sql = await getSql()
  try {
    // End the current active match
    const result = await sql`
      UPDATE matches 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = true
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "No active match found" }, { status: 400 })
    }

    return NextResponse.json({ success: true, endedMatch: result[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to end match" }, { status: 500 })
  }
}
