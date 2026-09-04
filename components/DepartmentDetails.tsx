import type { ReactNode } from "react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type Salesperson = { name: string };
type DealRecord = {
  id: string;
  title: string;
  value: number;
  status: string;
  createdAt: string;
  closedAt: string | null;
  salesperson: Salesperson;
};

type TaskRecord = {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  employee: { name: string };
};

type InvoiceRecord = {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
};

type CampaignRecord = {
  id: string;
  name: string;
  status: string;
  leadsGenerated: number;
  leadSource: string;
};

type LeaveRecord = {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  employee: { name: string; department: string };
};

export type DepartmentKey = "sales" | "operations" | "finance" | "marketing" | "hr";

type SalesDetails = {
  summary: { activeDealCount: number; pipelineValue: number };
  activeDeals: DealRecord[];
  recentlyClosedDeals: DealRecord[];
};

type OperationsDetails = {
  summary: { overdueTaskCount: number; completedToday: number; activeTeamMembers: number };
  overdueTasks: TaskRecord[];
};

type FinanceDetails = {
  summary: {
    monthlyRevenue: number;
    monthlyRevenueTarget: number;
    revenueAchievementPercentage: number;
  };
  pendingInvoices: InvoiceRecord[];
};

type MarketingDetails = {
  summary: { activeCampaignCount: number; leadsGeneratedThisWeek: number };
  campaigns: CampaignRecord[];
};

type HrDetails = {
  summary: { pendingLeaveRequestCount: number };
  pendingLeaveRequests: LeaveRecord[];
};

function RecordList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 min-w-0">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {empty ? (
        <p className="mt-2 text-sm text-slate-500">No records to show.</p>
      ) : (
        <ul className="mt-2 space-y-2">{children}</ul>
      )}
    </section>
  );
}

function RecordItem({
  title,
  meta,
}: {
  title: string;
  meta: Array<{ label: string; value: string }>;
}) {
  return (
    <li className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="break-words text-sm font-medium text-slate-900">{title}</p>
      <dl className="mt-1 grid gap-1">
        {meta.map((item) => (
          <div key={item.label} className="flex min-w-0 items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-slate-500">{item.label}</dt>
            <dd className="min-w-0 break-words text-right text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function SalesPanel({ data }: { data: SalesDetails }) {
  return (
    <>
      <p className="mt-4 text-sm text-slate-600">
        Full pipeline value {formatCurrency(data.summary.pipelineValue)} across{" "}
        {data.summary.activeDealCount} active deals.
      </p>
      <RecordList title="Active deals" empty={data.activeDeals.length === 0}>
        {data.activeDeals.map((deal) => (
          <RecordItem
            key={deal.id}
            title={deal.title}
            meta={[
              { label: "Value", value: formatCurrency(deal.value) },
              { label: "Owner", value: deal.salesperson.name },
              { label: "Opened", value: formatDate(deal.createdAt) },
            ]}
          />
        ))}
      </RecordList>
      <RecordList title="Recently closed" empty={data.recentlyClosedDeals.length === 0}>
        {data.recentlyClosedDeals.map((deal) => (
          <RecordItem
            key={deal.id}
            title={deal.title}
            meta={[
              { label: "Result", value: deal.status },
              { label: "Value", value: formatCurrency(deal.value) },
              { label: "Owner", value: deal.salesperson.name },
              {
                label: "Closed",
                value: deal.closedAt ? formatDate(deal.closedAt) : "Unknown",
              },
            ]}
          />
        ))}
      </RecordList>
    </>
  );
}

function OperationsPanel({ data }: { data: OperationsDetails }) {
  return (
    <RecordList title="Overdue tasks" empty={data.overdueTasks.length === 0}>
      {data.overdueTasks.map((task) => (
        <RecordItem
          key={task.id}
          title={task.title}
          meta={[
            { label: "Assigned to", value: task.employee.name },
            { label: "Status", value: task.status.replaceAll("_", " ") },
            { label: "Due", value: formatDate(task.dueDate) },
          ]}
        />
      ))}
    </RecordList>
  );
}

function FinancePanel({ data }: { data: FinanceDetails }) {
  return (
    <>
      <p className="mt-4 text-sm text-slate-600">
        Approved revenue this month {formatCurrency(data.summary.monthlyRevenue)} of{" "}
        {formatCurrency(data.summary.monthlyRevenueTarget)}.
      </p>
      <RecordList title="Pending invoices" empty={data.pendingInvoices.length === 0}>
        {data.pendingInvoices.map((invoice) => (
          <RecordItem
            key={invoice.id}
            title={invoice.customerName}
            meta={[
              { label: "Amount", value: formatCurrency(invoice.amount) },
              { label: "Due", value: formatDate(invoice.dueDate) },
            ]}
          />
        ))}
      </RecordList>
    </>
  );
}

function MarketingPanel({ data }: { data: MarketingDetails }) {
  return (
    <RecordList title="Campaigns" empty={data.campaigns.length === 0}>
      {data.campaigns.map((campaign) => (
        <RecordItem
          key={campaign.id}
          title={campaign.name}
          meta={[
            { label: "Status", value: campaign.status },
            { label: "Leads", value: String(campaign.leadsGenerated) },
            { label: "Source", value: campaign.leadSource },
          ]}
        />
      ))}
    </RecordList>
  );
}

function HrPanel({ data }: { data: HrDetails }) {
  return (
    <RecordList title="Pending leave requests" empty={data.pendingLeaveRequests.length === 0}>
      {data.pendingLeaveRequests.map((request) => (
        <RecordItem
          key={request.id}
          title={request.employee.name}
          meta={[
            { label: "Department", value: request.employee.department },
            {
              label: "Dates",
              value: `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`,
            },
            { label: "Reason", value: request.reason },
          ]}
        />
      ))}
    </RecordList>
  );
}

export function DepartmentDetails({
  department,
  data,
}: {
  department: DepartmentKey;
  data: unknown;
}) {
  switch (department) {
    case "sales":
      return <SalesPanel data={data as SalesDetails} />;
    case "operations":
      return <OperationsPanel data={data as OperationsDetails} />;
    case "finance":
      return <FinancePanel data={data as FinanceDetails} />;
    case "marketing":
      return <MarketingPanel data={data as MarketingDetails} />;
    case "hr":
      return <HrPanel data={data as HrDetails} />;
  }
}
