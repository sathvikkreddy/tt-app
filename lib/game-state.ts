export type GameState = {
  type: "normal" | "deuce" | "advantage" | "win"
  advantageTeam?: 1 | 2
  winner?: 1 | 2
}

export function getGameState(score1: number, score2: number, pointsToWin: number): GameState {
  const minScore = Math.min(score1, score2)
  const maxScore = Math.max(score1, score2)
  const scoreDiff = Math.abs(score1 - score2)
  const deuceThreshold = pointsToWin - 1

  // Check for win condition
  if (maxScore >= pointsToWin && scoreDiff >= 2) {
    return {
      type: "win",
      winner: score1 > score2 ? 1 : 2,
    }
  }

  // Check if we're in deuce territory (both teams at or above deuce threshold)
  if (minScore >= deuceThreshold) {
    if (scoreDiff === 0) {
      return { type: "deuce" }
    } else if (scoreDiff === 1) {
      return {
        type: "advantage",
        advantageTeam: score1 > score2 ? 1 : 2,
      }
    }
  }

  return { type: "normal" }
}
