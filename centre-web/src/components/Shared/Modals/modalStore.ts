import { create } from "zustand";

// Define the store state and actions
interface ModalStore {
  isOpen: boolean;
  modalContent: React.ReactNode | null;
  handleClose: (() => void) | null;
  setOpen: (modal: React.ReactNode, handleClose?: () => void) => Promise<void>;
  setClose: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Create the Zustand store
export const useModal = create<ModalStore>((set) => ({
  isOpen: false,
  modalContent: null,
  handleClose: null,
  isLoading: false,
  setIsLoading: (loading) => {
    set(() => ({ isLoading: loading }));
  },

  setOpen: async (modal, handleClose = () => {}) => {
    if (modal) {
      set(() => ({
        modalContent: modal,
        isOpen: true,
        handleClose,
      }));
    }
  },

  setClose: () => {
    set((state) => {
      if (state.handleClose) {
        state.handleClose(); // Trigger the handleClose function
      }
      return {
        isOpen: false,
        modalContent: null,
        handleClose: null,
      };
    });
  },
}));

export const openModal = async (
  modal: React.ReactNode,
  handleClose?: () => void,
) => {
  const { setOpen } = useModal.getState();
  await setOpen(modal, handleClose);
};
