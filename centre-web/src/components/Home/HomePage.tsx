import { Button, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { PageContainer } from "@/components/Shared/PageGrid";

type HomePageProps = Readonly<{
  onSignIn: () => void;
}>;

export default function HomePage({ onSignIn }: HomePageProps) {
  return (
    <PageContainer
      display="flex"
      flexDirection="column"
      sx={{
        background:
          "linear-gradient(180deg, rgba(233, 246, 255, 0.75) 0%, rgba(255, 255, 255, 1) 45%)",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Box
        maxWidth={720}
        width="100%"
        display="flex"
        flexDirection="column"
      >
        <Typography variant="h2" component="h1">
          EPIC.centre
        </Typography>
      </Box>

    </PageContainer>
  );
}

