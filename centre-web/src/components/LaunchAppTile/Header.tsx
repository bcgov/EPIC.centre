import { Box, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { EpicApp } from "@/models/EpicApp";

type HeaderProps = {
  data: EpicApp;
};
export const Header = ({ data }: HeaderProps) => {
  const { name, description } = data;
  return (
    <Box
      sx={{
        height: "110px",
        backgroundColor: "#F1F8FE",
      }}
    >
      <Box
        sx={{
          padding: "8px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="h6" component="div">
            {name}
          </Typography>
          <DragIndicatorIcon />
        </Box>
        <Typography variant="body2" width="100%">
          {description}
        </Typography>
      </Box>
    </Box>
  );
};
