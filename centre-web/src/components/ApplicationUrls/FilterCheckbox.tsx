import { Checkbox, CheckboxProps, SvgIcon } from "@mui/material";

// Drawn on a 20px grid so the 16px box's edges land on whole pixels.
// MUI's own icons are drawn on 24px and blur when scaled down to this size.
const unchecked = (
    <SvgIcon viewBox="0 0 20 20" sx={{ fontSize: 20 }}>
        <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </SvgIcon>
);

const checked = (
    <SvgIcon viewBox="0 0 20 20" sx={{ fontSize: 20 }}>
        <rect x="2" y="2" width="16" height="16" rx="3" />
        <path d="M6 10.2l2.6 2.6L14 7.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
);

export function FilterCheckbox(props: CheckboxProps) {
    return (
        <Checkbox
            icon={unchecked}
            checkedIcon={checked}
            // Even padding keeps the hover highlight a circle
            sx={{ p: 0.5, color: "text.secondary", "&.Mui-checked": { color: "primary.main" } }}
            {...props}
        />
    );
}
