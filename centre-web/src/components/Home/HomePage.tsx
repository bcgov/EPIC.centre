import { Typography, Box, Grid } from "@mui/material";

const applications = [
  {
    name: "Condition Repository",
    description: "Review and approve conditions",
  },
  {
    name: "EPIC.auth",
    description: "Manage users in all EPIC applications",
  },
  {
    name: "EPIC.compliance",
    description: "EAO's Compliance & Enforcement application",
  },
  {
    name: "EPIC.engage",
    description: "Public Engagement Platform",
  },
  {
    name: "EPIC.public",
    description: "Public project information and documents",
  },
  {
    name: "EPIC.submit",
    description: "Document submission Tool for Proponents and Holders",
  },
  {
    name: "EPIC.track",
    description: "Project tracking and reporting Tool",
  },
];



export default function HomePage() {
  return (
    <Box
      sx={{ marginBottom: "-0.5em" }}
    >
      <Box
        sx={{
          height: "8.1875em",
          background: "linear-gradient(180deg, #D8EAFD 0%, #FFF 100%)",
          position: "relative",
        }}
      >
        <Box
          sx={{
            margin: "0 auto",
            paddingLeft: { xs: "1em", sm: "2em", md: "3em", lg: "10.4375em" },
            position: "absolute",
            bottom: 0,
            paddingBottom: "0.5625em",
          }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#292929",
              fontFamily: '"BC Sans", sans-serif',
              fontSize: { xs: "1.5em", sm: "1.75em", md: "2em", lg: "2.25em" },
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "normal",
              margin: 0,
            }}
          >
            Welcome to EPIC.centre
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          margin: "0 auto",
          paddingLeft: { xs: "1em", sm: "2em", md: "3em", lg: "10.4375em" },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Grid container spacing={3} sx={{ position: "relative" }}>
          <Grid
            item
            xs={12}
            md={7}
            lg={8}
            sx={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <Typography
              sx={{
                color: "#292929",
                fontFamily: '"BC Sans", sans-serif',
                fontSize: { xs: "1em", sm: "1.0625em", lg: "1.125em" },
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "1.913em",
              }}
            >
              EPIC.centre gives you quick access to EAO applications, permission
              controls, and important resources in one place.
            </Typography>
            <Typography
              sx={{
                color: "#292929",
                fontFamily: '"BC Sans", sans-serif',
                fontSize: { xs: "1em", sm: "1.0625em", lg: "1.125em" },
                fontStyle: "normal",
                fontWeight: 600,
                lineHeight: "1.913em",
                marginBottom: "2.5em",
              }}
            >
              Log in with your IDIR to view all your assigned applications.
            </Typography>

            <Typography
              sx={{
                color: "#292929",
                fontFamily: '"BC Sans", sans-serif',
                fontSize: { xs: "0.9375em", lg: "1em" },
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "1.688em",
                marginBottom: "1.5em",
              }}
            >
              Based on your access level, EPIC.centre provides access to the
              following applications:
            </Typography>

            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingLeft: "1.5em",
                marginBottom: "1.5em",
                listStyleType: "disc",
              }}
            >
              {applications.map((app) => (
                <Box component="li" key={app.name} sx={{ marginBottom: "0.25em" }}>
                  <Typography
                    component="span"
                    sx={{
                      color: "#292929",
                      fontFamily: '"BC Sans", sans-serif',
                      fontSize: { xs: "0.9375em", lg: "1em" },
                      fontStyle: "normal",
                      fontWeight: 400,
                      lineHeight: "1.688em",
                    }}
                  >
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {app.name}
                    </Box>{" "}
                    - {app.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              sx={{
                color: "#292929",
                fontFamily: '"BC Sans", sans-serif',
                fontSize: { xs: "0.9375em", lg: "1em" },
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "1.688em",
              }}
            >
              Search all project information and documents directly through{" "}
              <Box component="span" sx={{ fontWeight: 600 }}>
                Document Search.
              </Box>
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={5}
            lg={4}
            sx={{
              display: "flex",
              alignItems: { xs: "center", md: "flex-start" },
              justifyContent: { xs: "right", md: "flex-start" },
              paddingTop: { xs: "2em", md: "0" },
              marginTop: { 
                xs: 0,        
                sm: "5em",   
                md: "20em",  
                lg: "20em"    
              },
              position: "relative",
              zIndex: 1,
              overflow: "visible",
              marginLeft: { xs: 0, md: "-5em", lg: "-10em" },
            }}
          >
            <Box
              component="img"
              src="/home_page_illustration.png"
              alt="Workspace illustration"
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "28em", md: "26em", lg: "32.8125em" },
                height: "auto",
                aspectRatio: "175/131",
                objectFit: "contain",
                position: "relative",
                pointerEvents: "none",
                marginLeft: { xs: 0, md: "-2em", lg: 0 },
              }}
            />
          </Grid>
        </Grid>
      </Box>

    </Box>
  );
}

