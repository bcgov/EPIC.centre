import { Box, List } from "@mui/material";
import EAORoutes from "./Routes";

export default function EaoSideNavBar() {
  return (
    <div style={{ height: "100%" }}>
      <Box
        sx={{
          overflow: "auto",
          borderRight: "1px solid #0000001A",
          width: 240,
          height: "calc(100vh - 88px)",
          zIndex: 0,
          position: "static",
        }}
      >
        <List>
          <EAORoutes />
        </List>
      </Box>
    </div>
  );
}
