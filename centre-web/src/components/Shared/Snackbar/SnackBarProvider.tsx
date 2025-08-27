import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSnackbar } from "./snackbarStore";

const SnackBarProvider: React.FC = () => {
  const { isOpen, setClose, severity, message } = useSnackbar();

  return (
    <Snackbar
      open={isOpen}
      onClose={setClose}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        onClose={setClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",

          "& .MuiIconButton-root": {
            color: "inherit",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackBarProvider;
