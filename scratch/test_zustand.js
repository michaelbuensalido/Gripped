const { createStore } = require('zustand/vanilla');
const { immer } = require('zustand/middleware/immer');

const store = createStore(immer((set, get) => ({
  ascents: [],
  logAscent: () => {
    set((state) => {
      state.ascents.push(1);
    });
    const current = get().ascents;
    console.log("Current length:", current.length);
  }
})));

store.getState().logAscent();
