import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/newpage")({
  component: NewPage,
});

function NewPage() {
  return (
    <>
      <h3>Hello! This is a lazy loaded page</h3>
      <p>This page wont be loaded initially, go back to <b>Root</b>, refresh the tab, and check the network tab</p>
    </>
  );
}
