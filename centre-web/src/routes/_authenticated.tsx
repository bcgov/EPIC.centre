import SideNavBar from '@/components/Shared/SideNavBar';
import { Box } from '@mui/material';
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, signinRedirect } = context.authentication;
    if (!isAuthenticated) {
      signinRedirect();
    }
  },
  component: AuthenticatedRoute,
})

function AuthenticatedRoute() {

  return (
    <div>
      <Box flexDirection={"row"} display={"flex"}>
            <SideNavBar />
            <Outlet />
          </Box>
    </div>
  );
}
