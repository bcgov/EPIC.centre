import { AppBar, Box, Divider, Grid, Typography } from "@mui/material";
import EAO_Logo from "@/assets/images/EAO_Logo.png";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import AppBarActions from "./AppBarActions";
import { AppConfig } from "@/utils/config";

export default function EAOAppBar() {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogoClick = () => {
    navigate({
      to: auth.isAuthenticated ? "/launchpad/" : "/",
    });
  };

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
          onClick={handleLogoClick}
          sx={{
            cursor: "pointer",
          }}
        >
          <img
            src={EAO_Logo}
            height={56}
            alt="Environmental Assessment Office Logo"
          />
          <Divider orientation="vertical" flexItem sx={{ m: 1 }} />
          <Typography
            variant="h2"
            color="inherit"
            component="div"
            paddingLeft={"0.5rem"}
            fontWeight={"bold"}
          >
            {AppConfig.appTitle || "EPIC.centre"}
          </Typography>
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
