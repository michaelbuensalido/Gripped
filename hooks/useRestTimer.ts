export function useRestTimer() {
  return {
    isActive: false,
    remainingSeconds: 0,
    progress: 0,
    formatTime: () => '00:00'
  };
}
