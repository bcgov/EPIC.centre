import { forwardRef } from "react";
import { Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { CentreLinkProps } from "./type";

// Forwards its ref so MUI wrappers like Tooltip can use it
export const CentreLink = forwardRef<HTMLAnchorElement, CentreLinkProps>(
  (props, ref) => {
    const { children, disabled, sx, onClick, ...rest } = props;

    if (disabled) {
      return children;
    }
    return (
      <MuiLink
        {...rest}
        ref={ref}
        onClick={onClick}
        sx={{
          color: BCDesignTokens.themeBlue90,
          textDecoration: "none",
          cursor: "pointer",
          "&:hover": {
            textDecoration: "underline",
          },
          ...sx,
        }}
      >
        {children}
      </MuiLink>
    );
  },
);

CentreLink.displayName = "CentreLink";
