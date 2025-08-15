import { alpha, ListItem, ListItemButton } from "@mui/material";
import { RouteType } from "./SideNavElements";
import { Link, useRouterState } from "@tanstack/react-router";
import { theme } from "@/styles/theme";
import { BCDesignTokens } from "epic.theme";

export const SubListItem = ({ route }: { route: RouteType }) => {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isActive =
    currentPath === route.path || currentPath.includes(route.path);
  return (
    <ListItem
      key={`sub-list-${route?.name}`}
      sx={{ margin: 0, paddingY: 0, pr: 0 }}
    >
      <Link
        to={route.path}
        style={{
          textDecoration: "none",
          margin: 0,
          padding: 0,
          color: "inherit",
        }}
        activeProps={{
          style: {
            color: theme.palette.primary.main,
            fontWeight: isActive ? "bold" : "normal",
            width: "100%",
          },
        }}
      >
        <ListItemButton
          key={`sub-list-button-${route?.name}`}
          sx={{
            marginLeft: "40px",
            borderLeft: `1px solid ${theme.palette.divider}`,
            backgroundColor: isActive
              ? alpha(theme.palette.secondary.main, 0.1)
              : "inherit",
          }}
        >
          <span
            key={`sub-list-text-${route?.name}`}
            style={{
              color: BCDesignTokens.themeGray100,
              fontWeight: isActive ? "bold" : "normal",
            }}
          >
            {route.name}
          </span>
        </ListItemButton>
      </Link>
    </ListItem>
  );
};
