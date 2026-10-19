import type { ReactNode } from "react";

import { DashboardPanel } from "./dashboard-panel";

type DataTableProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DataTable({ title, description, action, children }: DataTableProps) {
  return (
    <DashboardPanel title={title} description={description} action={action} padded={false}>
      <div className="overflow-x-auto">{children}</div>
    </DashboardPanel>
  );
}
