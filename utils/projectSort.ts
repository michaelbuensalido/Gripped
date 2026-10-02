export function sortProjects(projects: any[], sortOption: string) {
  return [...projects].sort((a: any, b: any) => {
    if (sortOption === 'Hardest') {
      return b.normalizedDifficulty - a.normalizedDifficulty;
    } else if (sortOption === 'Closest to sending') {
      const aClose = (a.highWaterMarkMoves || 0) / (a.totalMoves || 12);
      const bClose = (b.highWaterMarkMoves || 0) / (b.totalMoves || 12);
      return bClose - aClose;
    } else {
      // Recently tried
      return (b.lastTriedAt || b.createdAt) - (a.lastTriedAt || a.createdAt);
    }
  });
}
