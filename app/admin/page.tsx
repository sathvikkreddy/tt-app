"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Eye, RotateCcw } from "lucide-react"
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

export default function AdminPanel() {
  const [match, setMatch] = useState<Match | null>(null)
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [player3, setPlayer3] = useState("")
  const [player4, setPlayer4] = useState("")
  const [loading, setLoading] = useState(true)
  const [pointsToWin, setPointsToWin] = useState<11 | 21>(11)

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
  }, [])

  const createMatch = async () => {
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: matchType,
          player1,
          player2,
          player3: matchType === "doubles" ? player3 : undefined,
          player4: matchType === "doubles" ? player4 : undefined,
          points_to_win: pointsToWin,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMatch(data.match)
        // Reset form
        setPlayer1("")
        setPlayer2("")
        setPlayer3("")
        setPlayer4("")
        setPointsToWin(11)
      } else {
        // Show error message
        alert(data.error || "Failed to create match")
      }
    } catch (error) {
      console.error("Failed to create match:", error)
      alert("Failed to create match")
    }
  }

  const updateScore = async (team: 1 | 2, increment: boolean) => {
    if (!match) return

    try {
      const response = await fetch("/api/match/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team,
          increment,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMatch(data.match)
      } else {
        console.error("Failed to update score:", data.error)
        alert(data.error || "Failed to update score")
      }
    } catch (error) {
      console.error("Failed to update score:", error)
      alert("Failed to update score")
    }
  }

  const resetMatch = async () => {
    try {
      const response = await fetch("/api/match/reset", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
      }
    } catch (error) {
      console.error("Failed to reset match:", error)
    }
  }

  const endMatch = async () => {
    try {
      const response = await fetch("/api/match/end", {
        method: "POST",
      })

      if (response.ok) {
        setMatch(null)
      }
    } catch (error) {
      console.error("Failed to end match:", error)
    }
  }

  const checkWinCondition = (score1: number, score2: number, pointsToWin: number) => {
    const minScore = Math.min(score1, score2)
    const maxScore = Math.max(score1, score2)

    // Must reach winning score and have at least 2 point difference
    if (maxScore >= pointsToWin && maxScore - minScore >= 2) {
      return score1 > score2 ? 1 : 2
    }
    return null
  }

  const confirmWin = async (winner: number) => {
    try {
      const response = await fetch("/api/match/win", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winner }),
      })

      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
      }
    } catch (error) {
      console.error("Failed to confirm win:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <Link href="/">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Score
            </Button>
          </Link>
        </div>

        {match && match.is_active ? (
          <div className="space-y-6">
            {/* Current Match */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Current Match</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={match.type === "singles" ? "default" : "secondary"}>
                      {match.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">First to {match.points_to_win}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const winner = checkWinCondition(match.score1, match.score2, match.points_to_win)
                  return (
                    <>
                      {winner && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <h3 className="text-lg font-semibold text-green-800 mb-2">
                            🏆{" "}
                            {winner === 1
                              ? match.type === "singles"
                                ? "Player 1"
                                : "Team 1"
                              : match.type === "singles"
                                ? "Player 2"
                                : "Team 2"}{" "}
                            Wins!
                          </h3>
                          <Button onClick={() => confirmWin(winner)} className="bg-green-600 hover:bg-green-700">
                            Confirm Win & End Match
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team 1 Controls */}
                        <div
                          className={`text-center space-y-4 ${winner === 1 ? "bg-green-50 p-4 rounded-lg border-2 border-green-200" : ""}`}
                        >
                          <h3 className="text-lg font-semibold text-blue-600">
                            {match.type === "singles" ? "Player 1" : "Team 1"}
                          </h3>
                          <div className="space-y-1">
                            <div className="font-medium">{match.player1}</div>
                            {match.type === "doubles" && match.player3 && (
                              <div className="font-medium">{match.player3}</div>
                            )}
                          </div>
                          <div className="text-4xl font-bold text-blue-600 mb-4">{match.score1}</div>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateScore(1, false)}
                              disabled={match.score1 <= 0 || winner !== null}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => updateScore(1, true)} disabled={winner !== null}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Team 2 Controls */}
                        <div
                          className={`text-center space-y-4 ${winner === 2 ? "bg-green-50 p-4 rounded-lg border-2 border-green-200" : ""}`}
                        >
                          <h3 className="text-lg font-semibold text-green-600">
                            {match.type === "singles" ? "Player 2" : "Team 2"}
                          </h3>
                          <div className="space-y-1">
                            <div className="font-medium">{match.player2}</div>
                            {match.type === "doubles" && match.player4 && (
                              <div className="font-medium">{match.player4}</div>
                            )}
                          </div>
                          <div className="text-4xl font-bold text-green-600 mb-4">{match.score2}</div>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateScore(2, false)}
                              disabled={match.score2 <= 0 || winner !== null}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => updateScore(2, true)} disabled={winner !== null}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={resetMatch} disabled={winner !== null}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Scores
                        </Button>
                        <Button variant="destructive" onClick={endMatch}>
                          End Match
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* New Match Form - add the points selection here */
          <Card>
            <CardHeader>
              <CardTitle>Start New Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Match Type</Label>
                <RadioGroup
                  value={matchType}
                  onValueChange={(value: "singles" | "doubles") => setMatchType(value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="singles" id="singles" />
                    <Label htmlFor="singles">Singles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="doubles" id="doubles" />
                    <Label htmlFor="doubles">Doubles</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600">{matchType === "singles" ? "Player 1" : "Team 1"}</h3>
                  <div>
                    <Label htmlFor="player1">Player 1</Label>
                    <Input
                      id="player1"
                      value={player1}
                      onChange={(e) => setPlayer1(e.target.value)}
                      placeholder="Enter player name"
                    />
                  </div>
                  {matchType === "doubles" && (
                    <div>
                      <Label htmlFor="player3">Player 2</Label>
                      <Input
                        id="player3"
                        value={player3}
                        onChange={(e) => setPlayer3(e.target.value)}
                        placeholder="Enter player name"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">{matchType === "singles" ? "Player 2" : "Team 2"}</h3>
                  <div>
                    <Label htmlFor="player2">Player 1</Label>
                    <Input
                      id="player2"
                      value={player2}
                      onChange={(e) => setPlayer2(e.target.value)}
                      placeholder="Enter player name"
                    />
                  </div>
                  {matchType === "doubles" && (
                    <div>
                      <Label htmlFor="player4">Player 2</Label>
                      <Input
                        id="player4"
                        value={player4}
                        onChange={(e) => setPlayer4(e.target.value)}
                        placeholder="Enter player name"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Points to Win</Label>
                <RadioGroup
                  value={pointsToWin.toString()}
                  onValueChange={(value: "11" | "21") => setPointsToWin(Number.parseInt(value) as 11 | 21)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="11" id="points-11" />
                    <Label htmlFor="points-11">11 Points</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="21" id="points-21" />
                    <Label htmlFor="points-21">21 Points</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={createMatch}
                className="w-full"
                disabled={!player1 || !player2 || (matchType === "doubles" && (!player3 || !player4))}
              >
                Start Match
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
