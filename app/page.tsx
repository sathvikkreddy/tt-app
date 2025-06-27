"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import Link from "next/link"
import { getGameState } from "@/lib/game-state"

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
                const gameState = getGameState(match.score1, match.score2, match.points_to_win)

                if (gameState.type === "win") {
                  return (
                    <span className="text-green-600">
                      🏆{" "}
                      {gameState.winner === 1
                        ? match.type === "singles"
                          ? "Player 1"
                          : "Team 1"
                        : match.type === "singles"
                          ? "Player 2"
                          : "Team 2"}{" "}
                      Wins!
                    </span>
                  )
                } else if (gameState.type === "deuce") {
                  return <span className="text-yellow-600">⚡ DEUCE ⚡</span>
                } else {
                  return "Live Match"
                }
              })()}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Deuce notification for viewer */}
        {(() => {
          const gameState = getGameState(match.score1, match.score2, match.points_to_win)
          if (gameState.type === "deuce") {
            return (
              <Card className="mb-4 bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4 text-center">
                  <p className="text-yellow-800 font-medium">Game is in deuce - next point wins or advantage!</p>
                </CardContent>
              </Card>
            )
          }
          return null
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const gameState = getGameState(match.score1, match.score2, match.points_to_win)
            return (
              <>
                {/* Team 1 */}
                <Card
                  className={`text-center ${
                    gameState.type === "win" && gameState.winner === 1 ? "bg-green-50 border-green-200 border-2" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">
                      {match.type === "singles" ? "Player 1" : "Team 1"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Advantage indicator for Team 1 */}
                    {gameState.type === "advantage" && gameState.advantageTeam === 1 && (
                      <div className="bg-blue-100 border border-blue-300 rounded-md p-2 mb-4">
                        <span className="text-lg font-bold text-blue-800">🔥 ADVANTAGE</span>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-lg">{match.player1}</div>
                      {match.type === "doubles" && match.player3 && (
                        <div className="font-semibold text-lg">{match.player3}</div>
                      )}
                    </div>
                    <div className="text-6xl font-bold text-blue-600 mb-2">{match.score1}</div>
                    {gameState.type === "win" && gameState.winner === 1 && <div className="text-2xl">🏆</div>}
                  </CardContent>
                </Card>

                {/* Team 2 */}
                <Card
                  className={`text-center ${
                    gameState.type === "win" && gameState.winner === 2 ? "bg-green-50 border-green-200 border-2" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">
                      {match.type === "singles" ? "Player 2" : "Team 2"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Advantage indicator for Team 2 */}
                    {gameState.type === "advantage" && gameState.advantageTeam === 2 && (
                      <div className="bg-green-100 border border-green-300 rounded-md p-2 mb-4">
                        <span className="text-lg font-bold text-green-800">🔥 ADVANTAGE</span>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-lg">{match.player2}</div>
                      {match.type === "doubles" && match.player4 && (
                        <div className="font-semibold text-lg">{match.player4}</div>
                      )}
                    </div>
                    <div className="text-6xl font-bold text-green-600 mb-2">{match.score2}</div>
                    {gameState.type === "win" && gameState.winner === 2 && <div className="text-2xl">🏆</div>}
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
