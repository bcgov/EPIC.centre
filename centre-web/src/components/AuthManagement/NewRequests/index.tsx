import { Grid } from "@mui/material";
import { useAccessRequests } from "@/hooks/api/useAccessRequests";
import { RequestsTable } from "./RequestsTable";
import { AccessRequestStatus } from "@/models/AccessRequest";

export const NewRequests = () => {
  const {
    data: requests = [],
    isLoading,
    isError,
  } = useAccessRequests({
    params: {
      status: AccessRequestStatus.PENDING,
    },
  });

  return (
    <Grid container spacing={2} mt={"1em"}>
      <Grid item xs={12}>
        <RequestsTable
          requests={requests}
          isLoading={isLoading}
          isError={isError}
          searchText=""
        />
      </Grid>
    </Grid>
  );
};
