import { useLaunchpadStore } from "@/stores/launchpadStore";
import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import LinesEllipsis from "react-lines-ellipsis";

type HeaderProps = {
  data: {
    title: string;
    description: string;
  };
};
export const Header = ({ data }: HeaderProps) => {
  const { title, description } = data;
  const { showDescription } = useLaunchpadStore();
  return (
    <Box
      sx={{
        height: showDescription ? "90px" : "50px",
        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
      }}
    >
      <Box
        sx={{
          padding: "4px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
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
          <Typography variant="h4">{title}</Typography>
        </Box>
        {showDescription && (
          <Typography variant="body2" width="100%">
            <LinesEllipsis
              text={description}
              maxLine={2}
              ellipsis="..."
              trimRight
              basedOn="letters"
            />
          </Typography>
        )}
      </Box>
    </Box>
  );
};
