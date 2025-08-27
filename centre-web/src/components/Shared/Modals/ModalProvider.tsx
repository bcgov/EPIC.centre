import React from "react";
import { useModal } from "./modalStore";
import { Box, Modal } from "@mui/material";

const ModalProvider: React.FC = () => {
  const { modalContent, setClose, isOpen } = useModal();

  return (
    <Modal open={isOpen} onClose={setClose}>
      <Box>{modalContent}</Box>
    </Modal>
  );
};

export default ModalProvider;
