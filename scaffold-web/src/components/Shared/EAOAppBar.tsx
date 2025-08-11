import { AppBar, Box, Button, Grid, Typography } from "@mui/material";
import EAO_Logo from "@/assets/images/EAO_Logo.png";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { AppConfig } from "@/utils/config";
import { useAuth } from "react-oidc-context";

export default function EAOAppBar() {
  const auth = useAuth();
  return (
    <>
      <AppBar position="static" color="inherit" elevation={2}>
        <Grid
          container
          padding={"0.5rem"}
          margin={0}
          justifyContent="space-between"
        >
          <Grid display="flex" justifyContent="start" alignItems="center">
            <img src={EAO_Logo} height={72} />
            <Typography
              variant="h2"
              color="inherit"
              component="div"
              paddingLeft={"0.5rem"}
              fontWeight={"bold"}
            >
              {AppConfig.appTitle}
            </Typography>
          </Grid>
          <Grid display="flex" justifyContent="center" alignItems="center" paddingRight={"0.75rem"}>
            <AccountCircleIcon
              fontSize="large"
              color="primary"
              sx={{ marginRight: "0.25rem" }}
            ></AccountCircleIcon>
            {auth.isAuthenticated ? (
              <>
                <Box
                  display={"flex"}
                  flexDirection={"column"}
                  marginRight={"0.75rem"}
                >
                  <Typography variant="body1" color="inherit">
                    Hi, <b>{auth.user?.profile.name}</b>
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    {auth.user?.profile.email}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => auth.signoutRedirect()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => auth.signinRedirect()}
              >
                Sign In
              </Button>
            )}
          </Grid>
        </Grid>
      </AppBar>
    </>
  );
}
