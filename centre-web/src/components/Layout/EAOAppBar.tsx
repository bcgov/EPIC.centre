import { AppBar, Box, Grid } from "@mui/material";
import EAO_Logo from "@/assets/images/EAO_Logo.png";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import AppBarActions from "./AppBarActions";

export default function EAOAppBar() {
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      color="inherit"
      sx={{
        borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        boxShadow: "none",
      }}
    >
      <Grid
        container
        marginY={BCDesignTokens.layoutMarginSmall}
        paddingX={"0.5rem"}
        justifyContent="space-between"
      >
        <Box
          display="flex"
          justifyContent="start"
          alignItems="center"
          onClick={() =>
            navigate({
              to: `/launchpad`,
            })
          }
          sx={{
            cursor: "pointer",
          }}
        >
          <img
            src={EAO_Logo}
            height={56}
            alt="Environmental Assessment Office Logo"
          />
        </Box>
        <Grid
          display="flex"
          justifyContent="center"
          alignItems="center"
          paddingRight={"0.75rem"}
        >
          <AppBarActions />
        </Grid>
      </Grid>
    </AppBar>
  );
}
