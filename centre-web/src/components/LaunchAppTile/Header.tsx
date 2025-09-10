import { Box, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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

  return (
    <Box
      sx={{
        height: "100px",
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
            {title}
          </Typography>
          <DragIndicatorIcon htmlColor={BCDesignTokens.themeGray80} />
        </Box>
        <Typography variant="body2" width="100%">
          <LinesEllipsis
            text={description}
            maxLine={2}
            ellipsis="..."
            trimRight
            basedOn="letters"
          />
        </Typography>
      </Box>
    </Box>
  );
};
