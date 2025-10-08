import { LinkProps, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type CentreLinkProps = {
  disabled?: boolean;
} & LinkProps;

export const CentreLink = (props: CentreLinkProps) => {
  const { children, disabled, sx, onClick, ...rest } = props;
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event as any);
    }
  };
  
  if (disabled) {
    return children;
  }
  return (
    <MuiLink
      {...rest}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      sx={{
        color: BCDesignTokens.themeBlue90,
        textDecoration: "none",
        cursor: onClick ? "pointer" : "inherit",
        "&:focus": {
          outline: `2px solid ${BCDesignTokens.themeBlue90}`,
          outlineOffset: "2px",
          borderRadius: "2px",
        },
        "&:focus-visible": {
          outline: `2px solid ${BCDesignTokens.themeBlue90}`,
          outlineOffset: "2px",
          borderRadius: "2px",
        },
        ...sx,
      }}
    >
      {children}
    </MuiLink>
  );
};
