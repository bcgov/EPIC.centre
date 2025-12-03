import { Grid, Typography } from "@mui/material";
import { NewRequestsTable } from "./NewRequestsTable";
import { CentreUser } from "@/models/CentreUser";
import { useUserAccessRequests } from "@/hooks/api/useAccessRequests";
import { NewAccessRequestsSkeleton } from "../../NewRequests/NewRequestsSkeleton";
import { AccessRequestStatus } from "@/models/AccessRequest";

type NewAccessRequestsProps = {
  user?: CentreUser;
};
export const NewAccessRequests = ({ user }: NewAccessRequestsProps) => {
  const { data: requests = [], isPending } = useUserAccessRequests({
    user_auth_guid: user?.id || "",
    status: AccessRequestStatus.PENDING,
    enabled: !!user?.id,
  });

  if (isPending) {
    return <NewAccessRequestsSkeleton />;
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={"normal"}>
          New Access Requests
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <NewRequestsTable requests={requests} user={user} />
      </Grid>
    </Grid>
  );
};
