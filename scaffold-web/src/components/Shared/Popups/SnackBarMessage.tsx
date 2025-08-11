import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";

export type SnackBarMessageProps = {
  message: string;
  severity?: "success" | "info" | "warning" | "error";
};

const SnackBarMessage: React.FC<SnackBarMessageProps> = ({
  message,
  severity = "success",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (message) {
      setIsOpen(true);
    }
  }, [message]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackBarMessage;
