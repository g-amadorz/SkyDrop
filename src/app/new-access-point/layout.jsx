import { AccesspointProvider } from "../contexts/AccesspointProvider";

export default function Layout({ children }) {
  return (
    <AccesspointProvider>
      {children}
    </AccesspointProvider>
  );
}
