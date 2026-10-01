type Listener = () => void;
const listeners = new Set<Listener>();

export const dbEvents = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  emit() {
    for (const listener of Array.from(listeners)) {
      listener();
    }
  }
};
