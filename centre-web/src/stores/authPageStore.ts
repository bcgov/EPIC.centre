import { create } from "zustand";

type TabStore = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const useTabStore = create<TabStore>((set) => ({
  activeTab: "",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
