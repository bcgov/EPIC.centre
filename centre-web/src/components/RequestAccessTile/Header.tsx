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
  return (
    <Box
      sx={{
        height: "90px",
        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
        overflow: "hidden",
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
          width: "100%",
          boxSizing: "border-box",
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
          <Typography
            variant="h4"
            component="div"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={description}
        >
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
