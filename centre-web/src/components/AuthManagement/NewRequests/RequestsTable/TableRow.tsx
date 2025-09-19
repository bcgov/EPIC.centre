import { CentreLink } from "@/components/Shared/CentreLink";
import { CentreTableCell } from "@/components/Shared/CentreTable";
import { Stack, TableRow } from "@mui/material";
import { getAppChipTitle } from "../../utils";
import { AppChip } from "@/components/Shared/AppChip";
import { AccessRequest } from "@/models/AccessRequest";

type Props = {
  readonly request: AccessRequest;
};
export default function RequestsTableRow({ request }: Props) {
  return (
    <TableRow>
      <CentreTableCell>{`${request.user.last_name ?? ""}, ${request.user.first_name ?? ""}`}</CentreTableCell>
      <CentreTableCell sx={{ height: "35px" }}>
        {/* <Stack direction="row" spacing={1} flexWrap="wrap">
          {request.user.apps.map((app: any) => (
            <AppChip key={app} appName={getAppChipTitle(app)} />
          ))}
        </Stack> */}
      </CentreTableCell>
      <CentreTableCell>
        <CentreLink>View/Edit Access</CentreLink>
      </CentreTableCell>
    </TableRow>
  );
}
