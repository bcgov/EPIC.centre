import {
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
} from "@mui/material";
import { theme } from "@/styles/theme";

export const SubListItemSkeleton = () => {
  return (
    <ListItem sx={{ margin: 0, padding: 0 }}>
      <ListItemButton
        sx={{
          marginLeft: "40px",
          borderLeft: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ListItemText>
          <Skeleton />
        </ListItemText>
      </ListItemButton>
    </ListItem>
  );
};
