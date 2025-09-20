import { GreenBadge } from "@/components/Shared/Badges";
import BarTitle from "@/components/Shared/BarTitle.tsx";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { NewAccessRequests } from "./NewAccessRequests";
import { CurrentAccessLevel } from "./CurrentAccessLevel";

export const UserAccess = () => {
  return (
    <Box
      sx={{
        padding: "16px",
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
      }}
    >
      <Grid container alignItems="flex-start">
        <Grid
          item
          xs={12}
          container
          justifyContent={"space-between"}
          alignItems="center"
        >
          <Grid item>
            <BarTitle>
              <Typography variant="h4" gutterBottom>
                Coby, Wanda
              </Typography>
            </BarTitle>
          </Grid>
          <Grid item>
            <Stack direction="row" alignContent={"center"} alignItems="center">
              <Typography
                variant="subtitle1"
                sx={{ mr: "20px", fontWeight: "bold", color: "#99A6B4" }}
              >
                Status:
              </Typography>
              <Typography variant="body1">
                <GreenBadge label="Active" />
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Grid item xs={12} mt={"24px"}>
          <NewAccessRequests />
        </Grid>
        <Grid item xs={12} mt={"24px"}>
          <CurrentAccessLevel />
        </Grid>
      </Grid>
    </Box>
  );
};
