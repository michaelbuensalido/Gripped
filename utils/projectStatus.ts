export type DerivedProjectStatus = 'Not started' | 'Working' | 'Close';

export function getDerivedProjectStatus(
  burns: number,
  highWaterMarkMoves: number,
  totalMoves: number | null | undefined
): DerivedProjectStatus {
  if (burns === 0) return 'Not started';
  
  if (burns >= 10) return 'Close';
  
  if (totalMoves && totalMoves > 0 && highWaterMarkMoves > 0) {
    if (highWaterMarkMoves / totalMoves >= 0.8) {
      return 'Close';
    }
  }
  
  return 'Working';
}
