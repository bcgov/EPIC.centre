import { Box, Typography, IconButton } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { BCDesignTokens } from "epic.theme";
import LinesEllipsis from "react-lines-ellipsis";
import { useLaunchpadStore } from "@/stores/launchpadStore";

type HeaderProps = {
  data: {
    title: string;
    description: string;
  };
  dragListeners?: any;
  dragAttributes?: any;
};
export const Header = ({
  data,
  dragListeners,
  dragAttributes,
}: HeaderProps) => {
  const { showDescription } = useLaunchpadStore();
  const { title, description } = data;

  return (
    <Box
      sx={{
        height: showDescription ? "100px" : "50px",
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
          <IconButton
            size="small"
            {...dragListeners}
            {...dragAttributes}
            sx={{
              cursor: dragListeners ? "grab" : "default",
              "&:active": {
                cursor: dragListeners ? "grabbing" : "default",
              },
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
            aria-label="Drag to reorder"
            role="button"
            tabIndex={0}
          >
            <DragIndicatorIcon htmlColor={BCDesignTokens.themeGray80} />
          </IconButton>
        </Box>
        {showDescription && (
          <Typography 
            variant="body2" 
            sx={{ 
              width: "100%", 
              minWidth: 0,
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
        )}
      </Box>
    </Box>
  );
};
