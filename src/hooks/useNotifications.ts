// Platzhalter — wird spaeter mit echtem Backend verbunden
export function useNotifications() {
  return {
    data: [] as Array<{ id: string; title: string; body: string; createdAt: string }>,
    isLoading: false,
  };
}
