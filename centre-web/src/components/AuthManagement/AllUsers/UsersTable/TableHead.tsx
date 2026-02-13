import { CentreTableHeadCell } from "@/components/Shared/CentreTable";
import { Box, TableHead, TableRow, TableSortLabel } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { BCDesignTokens } from "epic.theme";

export type SortField = "name" | "username";
export type SortOrder = "asc" | "desc";

type UsersTableHeadProps = Readonly<{
  orderBy: SortField;
  order: SortOrder;
  onRequestSort: (event: React.MouseEvent<unknown>, field: SortField) => void;
}>;

export default function UsersTableHead({
  orderBy,
  order,
  onRequestSort,
}: UsersTableHeadProps) {
  const createSortHandler = (field: SortField) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, field);
  };

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
        <CentreTableHeadCell sx={{ width: "85%" }}>
          <TableSortLabel
            active={orderBy === "name"}
            direction={orderBy === "name" ? order : "asc"}
            onClick={createSortHandler("name")}
          >
            User Name
            {orderBy === "name" ? (
              <Box component="span" sx={visuallyHidden}>
                {order === "desc" ? "sorted descending" : "sorted ascending"}
              </Box>
            ) : null}
          </TableSortLabel>
        </CentreTableHeadCell>
        <CentreTableHeadCell sx={{ width: "15%" }}>Action</CentreTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
