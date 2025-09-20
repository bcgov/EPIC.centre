import {
  TableCell,
  TableCellProps,
  TableHead,
  TableHeadProps,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const CentreTableHeadCell = (props: TableCellProps) => {
  const { children, sx, ...rest } = props;
  return (
    <TableCell
      sx={{
        color: BCDesignTokens.themeGray70,
        fontSize: BCDesignTokens.typographyFontSizeSmallBody,
        "&:hover": {
          color: BCDesignTokens.surfaceColorMenusHover,
        },
        border: "none",
        padding: BCDesignTokens.layoutPaddingXsmall,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </TableCell>
  );
};

export const CentreTableCell = (props: TableCellProps) => {
  const { children, sx, ...rest } = props;
  return (
    <TableCell
      sx={{
        borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        padding: `${BCDesignTokens.layoutPaddingSmall} !important`,
        "&:first-of-type": {
          borderLeft: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          borderTopLeftRadius: 5,
          borderBottomLeftRadius: 5,
        },
        "&:last-of-type": {
          borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          borderTopRightRadius: 5,
          borderBottomRightRadius: 5,
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </TableCell>
  );
};

export const CentreTableHead = (props: TableHeadProps) => {
  const { children, sx, ...rest } = props;
  return (
    <TableHead
      sx={{
        border: 0,
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </TableHead>
  );
};
