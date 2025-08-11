import { createFileRoute } from "@tanstack/react-router";
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { usePlansData } from "@/hooks/usePlans";
import { Plan } from "@/models/Plan";
import { Link } from "@tanstack/react-router";
import { OpenInNew } from "@mui/icons-material";

export const Route = createFileRoute("/eao-plans/")({
  component: PlanListPage,
});

function PlanListPage() {
  const { isLoading, data, isError, error } = usePlansData();

  const plans: Array<Plan> = data as Array<Plan>;

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (isError) {
    return <h2>{error.message}</h2>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table width={"100%"} aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Plan</TableCell>
              <TableCell align="right">Submitted date</TableCell>
              <TableCell align="right">Submitted by</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans?.map((row: Plan) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Link
                    to={"/eao-plans/$planId"}
                    params={{ planId: `${row.id}` }}
                  >
                    {row.name}
                  </Link>
                  <OpenInNew fontSize={"small"} sx={{ pl: ".25rem" }} />
                </TableCell>
                <TableCell align="right">{row.submittedDate}</TableCell>
                <TableCell align="right">{row.submittedBy}</TableCell>
                <TableCell align="right">
                  {row.isCompleted ? (
                    <Chip label="Completed" color="success" />
                  ) : (
                    <Chip label="Not Started" color="error" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
