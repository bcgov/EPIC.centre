import { Box, Tab, TabProps, Tabs, TabsProps } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const CentreTab = (props: TabProps) => {
  const { children, sx, ...rest } = props;
  return (
    <Tab
      disableRipple
      sx={{
        height: "35px",
        minHeight: 0,
        border: `1px solid ${BCDesignTokens.surfaceColorSecondaryButtonHover}`,
        borderRadius: "0px",
        borderBottom: "none",
        fontWeight: "inherit",
        color: BCDesignTokens.surfaceColorPrimaryButtonDefault,
        marginRight: "8px",
        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
        "&.Mui-selected": {
          backgroundColor: BCDesignTokens.surfaceColorSecondaryButtonDefault,
          color: BCDesignTokens.typographyColorPrimary,
          border: `1px solid ${BCDesignTokens.surfaceColorSecondaryButtonHover}`,
          borderBottom: "none",
          fontWeight: "700",
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Tab>
  );
};

export const CentreTabs = (props: TabsProps) => {
  const { children, TabIndicatorProps, ...rest } = props;
  const { sx: TipSx, ...restTabIndicatorProps } = TabIndicatorProps ?? {};
  return (
    <Box
      sx={{
        borderBottom: 2,
        borderColor: BCDesignTokens.themePrimaryGold,
        "& .MuiTabs-root": {
          height: 35,
          minHeight: 0,
        },
      }}
    >
      <Tabs
        TabIndicatorProps={{
          sx: { display: "none", ...TipSx },
          ...restTabIndicatorProps,
        }}
        {...rest}
      >
        {children}
      </Tabs>
    </Box>
  );
};
