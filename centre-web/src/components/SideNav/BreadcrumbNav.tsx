import React, { useMemo } from "react";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import { theme } from "@/styles/theme";

interface RouteSegment {
  title: string;
  path?: string;
}

const BreadcrumbNav: React.FC = () => {
  const matches = useRouterState({ select: (s) => s.matches });

  const breadcrumbs = useMemo(() => {
    return matches
      .flatMap((match) => {
        if (!match.meta) return [];

        return match.meta.map((meta: any) => ({
          title: meta.title,
          path: meta.path || match.pathname,
        }));
      })
      .filter(Boolean) as RouteSegment[];
  }, [matches]);

  return (
    <Box
      sx={{
        p: 1,
        paddingLeft: theme.spacing(4),
        borderBottom: "1px solid #0000001A",
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map(
          (segment: { title: string; path?: string }, index: number) => {
            const { title, path } = segment;
            const isCurrentPage = index === breadcrumbs.length - 1;

            if (isCurrentPage) {
              return (
                <Typography key={path} color="text.primary">
                  {title}
                </Typography>
              );
            }

            return (
              <Link
                key={path}
                style={{
                  color: theme.palette.primary.dark,
                  textDecoration: "underline",
                }}
                to={path}
              >
                {title}
              </Link>
            );
          },
        )}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNav;
