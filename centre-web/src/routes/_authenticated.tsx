import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, signinRedirect } = context.authentication;
    if (!isAuthenticated) {
      signinRedirect();
    }
  },
})
