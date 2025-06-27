"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import Link from "next/link"

interface Match {
  id: number
  type: "singles" | "doubles"
  player1: string
  player2: string
  player3?: string
  player4?: string
  score1: number
  score2: number
  points_to_win: number
  winner?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const checkWinCondition = (score1: number, score2: number, pointsToWin: number) => {
  const minScore = Math.min(score1, score2)
  const maxScore = Math.max(score1, score2)

  if (maxScore >= pointsToWin && maxScore - minScore >= 2) {
    return score1 > score2 ? 1 : 2
  }
  return null
}

export default function ScoreViewer() {
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMatch = async () => {
    try {
      const response = await fetch("/api/match")
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
      }
    } catch (error) {
      console.error("Failed to fetch match:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()

    // Poll every 5 seconds
    const interval = setInterval(fetchMatch, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-lg">Loading match...</div>
      </div>
    )
  }

  if (!match || !match.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Active Match</h2>
            <p className="text-muted-foreground mb-4">There's no table tennis match currently in progress.</p>
            <Link href="/admin">
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Start New Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Table Tennis Score</h1>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>

        <Card className="mb-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2 gap-2">
              <Badge variant={match.type === "singles" ? "default" : "secondary"}>{match.type.toUpperCase()}</Badge>
              <Badge variant="outline">First to {match.points_to_win}</Badge>
            </div>
            <CardTitle className="text-2xl">
              {(() => {
                const winner = checkWinCondition(match.score1, match.score2, match.points_to_win)
                return winner ? (
                  <span className="text-green-600">
                    🏆{" "}
                    {winner === 1
                      ? match.type === "singles"
                        ? "Player 1"
                        : "Team 1"
                      : match.type === "singles"
                        ? "Player 2"
                        : "Team 2"}{" "}
                    Wins!
                  </span>
                ) : (
                  "Live Match"
                )
              })()}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const winner = checkWinCondition(match.score1, match.score2, match.points_to_win)
            return (
              <>
                {/* Team 1 */}
                <Card className={`text-center ${winner === 1 ? "bg-green-50 border-green-200 border-2" : ""}`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">
                      {match.type === "singles" ? "Player 1" : "Team 1"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-lg">{match.player1}</div>
                      {match.type === "doubles" && match.player3 && (
                        <div className="font-semibold text-lg">{match.player3}</div>
                      )}
                    </div>
                    <div className="text-6xl font-bold text-blue-600 mb-2">{match.score1}</div>
                    {winner === 1 && <div className="text-2xl">🏆</div>}
                  </CardContent>
                </Card>

                {/* Team 2 */}
                <Card className={`text-center ${winner === 2 ? "bg-green-50 border-green-200 border-2" : ""}`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">
                      {match.type === "singles" ? "Player 2" : "Team 2"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-lg">{match.player2}</div>
                      {match.type === "doubles" && match.player4 && (
                        <div className="font-semibold text-lg">{match.player4}</div>
                      )}
                    </div>
                    <div className="text-6xl font-bold text-green-600 mb-2">{match.score2}</div>
                    {winner === 2 && <div className="text-2xl">🏆</div>}
                  </CardContent>
                </Card>
              </>
            )
          })()}
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Match started: {new Date(match.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
