import { useState } from "react";
import { Box, List, ListItem, ListItemButton } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { theme } from "@/styles/theme";
import { useAuth } from "react-oidc-context";

export default function SideNavBar() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  let routeMenuItems = [
    {
      routeName: "Root",
      path: "/",
    },
    {
      routeName: "About",
      path: "/about",
    },
    {
      routeName: "Lazy Loaded Page",
      path: "/newpage",
    },
    {
      routeName: "Plans",
      path: "/eao-plans",
    },
    {
      routeName: "Users",
      path: "/users",
    },
  ];

  const authenticatedRouteMenuItems = [
    {
      routeName: "Profile",
      path: "/profile",
    },
  ];

  if(isAuthenticated) {
    routeMenuItems = routeMenuItems.concat(authenticatedRouteMenuItems);
  }

  return (
    <div>
      <Box
        sx={{ overflow: "auto", borderRight: "1px solid #0000001A" }}
        width={240}
        height={"calc(100vh - 88px)"}
      >
        <List>
          {routeMenuItems.map((route) => (
            <ListItem key={route.routeName}>
              <Link
                to={route.path}
                onClick={() => setCurrentPath(route.path)}
                activeProps={{style: {
                  color: theme.palette.primary.main,
                  fontWeight: currentPath === route.path ? "bold" : "normal",
                  textDecoration: "none",
                  width: "100%",
                }}}
              >
                <ListItemButton
                  sx={{
                    pl: "2rem",
                    backgroundColor:
                      currentPath === route.path
                        ? "rgba(0, 0, 0, 0.1)"
                        : "transparent",
                    borderLeft:
                      currentPath === route.path
                        ? `4px solid ${theme.palette.primary.main}`
                        : "none",
                  }}
                >
                  <span style={{ color: "inherit" }}>{route.routeName}</span>
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );
}
