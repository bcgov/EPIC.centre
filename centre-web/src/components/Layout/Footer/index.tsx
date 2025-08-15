import { Box, Divider, Grid, Typography } from "@mui/material";
import EAOLogo from "@/assets/images/EAO_Logo.png";
import { COPYRIGHT_TEXT, FOOTER_COLORS, FOOTER_DESCRIPTION } from "./constants";
import { theme } from "@/styles/theme";

const Footer = () => {
  return (
    <Grid container justifyContent="center" alignItems="center" spacing={0}>
      <Grid
        item
        xs={12}
        sx={{
          backgroundColor: FOOTER_COLORS.BACKGROUND,
          borderTop: `6px solid ${FOOTER_COLORS.BORDER}`,
          borderBottom: `6px solid ${FOOTER_COLORS.BORDER}`,
        }}
        padding={{ xs: "2em 1em", md: "2em 6em" }}
      >
        <Typography variant="body1" color="white">
          {FOOTER_DESCRIPTION}
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        padding={{ xs: "2em 1em", md: "2em 6em" }}
        container
        justifyContent={"flex-start"}
        alignItems="flex-start"
        rowSpacing={3}
      >
        <Grid
          item
          xs={12}
          md={6}
          container
          justifyContent={"flex-start"}
          alignItems="flex-start"
          rowSpacing={3}
        >
          <Grid item xs={12}>
            <Box>
              <img
                src={EAOLogo}
                alt="EAO Logo"
                style={{ height: "5em", width: "24em" }}
              />
            </Box>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ borderColor: theme.palette.text.primary }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1">{COPYRIGHT_TEXT}</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Footer;
