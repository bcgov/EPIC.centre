import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/launchpad/')({
  component: () => <div>Hello /_authenticated/launchpad/!</div>
})

function Launchpad() {
  return <div>Hello /_authenticated/launchpad/!</div>
}
