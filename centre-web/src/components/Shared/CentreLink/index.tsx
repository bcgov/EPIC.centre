import { Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { CentreLinkProps } from "./type";

export const CentreLink = (props: CentreLinkProps) => {
  const { children, disabled, sx, onClick, ...rest } = props;

  if (disabled) {
    return children;
  }
  return (
    <MuiLink
      {...rest}
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
};
