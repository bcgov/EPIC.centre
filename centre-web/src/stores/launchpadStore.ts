import { create } from "zustand";
import { persist } from "zustand/middleware";

type LaunchpadStore = {
  showDescription: boolean;
  setShowDescription: (value: boolean) => void;
};

export const useLaunchpadStore = create<LaunchpadStore>()(
  persist(
    (set) => ({
      showDescription: true,
      setShowDescription: (value) => set({ showDescription: value }),
    }),
    {
      name: "launchpad-storage",
    }
  )
);

