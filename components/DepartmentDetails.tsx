"use client";

import { useState, type ReactNode } from "react";

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

type EmployeeRecord = { id: string; name: string; department: string };

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
  activeEmployees: EmployeeRecord[];
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

function ActionMessage({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-2 text-sm text-emerald-700" role="status" aria-live="polite">
          {success}
        </p>
      )}
    </>
  );
}

function ActionButton({
  label,
  loading,
  disabled = false,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="min-h-11 w-full rounded-md bg-slate-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? "Saving..." : label}
    </button>
  );
}

async function submitAction(
  endpoint: string,
  body: Record<string, string>,
  onUnauthenticated: () => void,
) {
  const response = await fetch(endpoint, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    onUnauthenticated();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Unable to complete this action.");
  }
}

function SalesPanel({ data, onActionSuccess, onUnauthenticated }: { data: SalesDetails; onActionSuccess: (message?: string) => void; onUnauthenticated: () => void }) {
  const [selectedDealId, setSelectedDealId] = useState("");
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateDeal(status: "WON" | "LOST") {
    if (!selectedDealId) return;
    setAction(status); setError(""); setSuccess("");
    try {
      await submitAction(`/api/sales/${selectedDealId}`, { status }, onUnauthenticated);
      const message = `Deal marked ${status === "WON" ? "won" : "lost"}.`;
      setSuccess(message); setSelectedDealId(""); onActionSuccess(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update the deal.");
    } finally { setAction(""); }
  }

  return (
    <>
      <p className="mt-4 text-sm text-slate-600">
        Full pipeline value {formatCurrency(data.summary.pipelineValue)} across{" "}
        {data.summary.activeDealCount} active deals.
      </p>
      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedDealId} onChange={(event) => setSelectedDealId(event.target.value)} aria-label="Select a deal">
          <option value="">Select a deal</option>
          {data.activeDeals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
        </select>
        <ActionButton label="Mark Won" loading={action === "WON"} disabled={!selectedDealId} onClick={() => void updateDeal("WON")} />
        <ActionButton label="Mark Lost" loading={action === "LOST"} disabled={!selectedDealId} onClick={() => void updateDeal("LOST")} />
      </div>
      <ActionMessage error={error} success={success} />
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

function OperationsPanel({ data, onActionSuccess, onUnauthenticated }: { data: OperationsDetails; onActionSuccess: (message?: string) => void; onUnauthenticated: () => void }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reassignTask() {
    if (!selectedTaskId || !selectedEmployeeId) return;
    setIsSaving(true); setError(""); setSuccess("");
    try {
      await submitAction(`/api/operations/tasks/${selectedTaskId}/reassign`, { employeeId: selectedEmployeeId }, onUnauthenticated);
      const message = "Task reassigned.";
      setSuccess(message); setSelectedTaskId(""); setSelectedEmployeeId(""); onActionSuccess(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to reassign the task.");
    } finally { setIsSaving(false); }
  }

  return (
    <RecordList title="Overdue tasks" empty={data.overdueTasks.length === 0}>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row">
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} aria-label="Select an overdue task">
          <option value="">Select a task</option>
          {data.overdueTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} aria-label="Select an employee">
          <option value="">Select an employee</option>
          {data.activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
        <ActionButton label="Reassign task" loading={isSaving} disabled={!selectedTaskId || !selectedEmployeeId} onClick={() => void reassignTask()} />
      </div>
      <ActionMessage error={error} success={success} />
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

function FinancePanel({ data, onActionSuccess, onUnauthenticated }: { data: FinanceDetails; onActionSuccess: (message?: string) => void; onUnauthenticated: () => void }) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function approveInvoice() {
    if (!selectedInvoiceId) return;
    setIsSaving(true); setError(""); setSuccess("");
    try {
      await submitAction(`/api/finance/invoices/${selectedInvoiceId}/approve`, {}, onUnauthenticated);
      const message = "Invoice approved.";
      setSuccess(message); setSelectedInvoiceId(""); onActionSuccess(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to approve the invoice.");
    } finally { setIsSaving(false); }
  }

  return (
    <>
      <p className="mt-4 text-sm text-slate-600">
        Approved revenue this month {formatCurrency(data.summary.monthlyRevenue)} of{" "}
        {formatCurrency(data.summary.monthlyRevenueTarget)}.
      </p>
      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedInvoiceId} onChange={(event) => setSelectedInvoiceId(event.target.value)} aria-label="Select a pending invoice">
          <option value="">Select an invoice</option>
          {data.pendingInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.customerName}</option>)}
        </select>
        <ActionButton label="Approve invoice" loading={isSaving} disabled={!selectedInvoiceId} onClick={() => void approveInvoice()} />
      </div>
      <ActionMessage error={error} success={success} />
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

function MarketingPanel({ data, onActionSuccess, onUnauthenticated }: { data: MarketingDetails; onActionSuccess: (message?: string) => void; onUnauthenticated: () => void }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedCampaign = data.campaigns.find((campaign) => campaign.id === selectedCampaignId);

  async function updateCampaign() {
    if (!selectedCampaign) return;
    const status = selectedCampaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setIsSaving(true); setError(""); setSuccess("");
    try {
      await submitAction(`/api/marketing/campaigns/${selectedCampaign.id}/status`, { status }, onUnauthenticated);
      const message = `Campaign ${status === "ACTIVE" ? "activated" : "paused"}.`;
      setSuccess(message); setSelectedCampaignId(""); onActionSuccess(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update the campaign.");
    } finally { setIsSaving(false); }
  }

  return (
    <RecordList title="Campaigns" empty={data.campaigns.length === 0}>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row">
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} aria-label="Select a campaign">
          <option value="">Select a campaign</option>
          {data.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </select>
        <ActionButton label={selectedCampaign?.status === "ACTIVE" ? "Pause campaign" : "Activate campaign"} loading={isSaving} disabled={!selectedCampaignId} onClick={() => void updateCampaign()} />
      </div>
      <ActionMessage error={error} success={success} />
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

function HrPanel({ data, onActionSuccess, onUnauthenticated }: { data: HrDetails; onActionSuccess: (message?: string) => void; onUnauthenticated: () => void }) {
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function approveLeave() {
    if (!selectedRequestId) return;
    setIsSaving(true); setError(""); setSuccess("");
    try {
      await submitAction(`/api/hr/leave-requests/${selectedRequestId}/approve`, {}, onUnauthenticated);
      const message = "Leave request approved.";
      setSuccess(message); setSelectedRequestId(""); onActionSuccess(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to approve the leave request.");
    } finally { setIsSaving(false); }
  }

  return (
    <RecordList title="Pending leave requests" empty={data.pendingLeaveRequests.length === 0}>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row">
        <select className="min-h-11 min-w-0 w-full rounded-md border border-slate-200 px-3 text-sm lg:flex-1" value={selectedRequestId} onChange={(event) => setSelectedRequestId(event.target.value)} aria-label="Select a pending leave request">
          <option value="">Select a leave request</option>
          {data.pendingLeaveRequests.map((request) => <option key={request.id} value={request.id}>{request.employee.name}</option>)}
        </select>
        <ActionButton label="Approve leave" loading={isSaving} disabled={!selectedRequestId} onClick={() => void approveLeave()} />
      </div>
      <ActionMessage error={error} success={success} />
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
  onActionSuccess,
  onUnauthenticated,
}: {
  department: DepartmentKey;
  data: unknown;
  onActionSuccess: (message?: string) => void;
  onUnauthenticated: () => void;
}) {
  switch (department) {
    case "sales":
      return <SalesPanel data={data as SalesDetails} onActionSuccess={onActionSuccess} onUnauthenticated={onUnauthenticated} />;
    case "operations":
      return <OperationsPanel data={data as OperationsDetails} onActionSuccess={onActionSuccess} onUnauthenticated={onUnauthenticated} />;
    case "finance":
      return <FinancePanel data={data as FinanceDetails} onActionSuccess={onActionSuccess} onUnauthenticated={onUnauthenticated} />;
    case "marketing":
      return <MarketingPanel data={data as MarketingDetails} onActionSuccess={onActionSuccess} onUnauthenticated={onUnauthenticated} />;
    case "hr":
      return <HrPanel data={data as HrDetails} onActionSuccess={onActionSuccess} onUnauthenticated={onUnauthenticated} />;
  }
}
