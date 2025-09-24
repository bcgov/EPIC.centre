import { CentreTableHeadCell } from "@/components/Shared/CentreTable";
import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function UsersTableHead() {
  return (
    <TableHead
      sx={{
        border: 0,
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
        },
      }}
    >
      <TableRow>
        <CentreTableHeadCell>User Name</CentreTableHeadCell>
        {/* <CentreTableHeadCell sx={{ width: "65%" }}>
          Application
        </CentreTableHeadCell> */}
        <CentreTableHeadCell>Action</CentreTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
