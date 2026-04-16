"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowStateName } from "@/types";

interface CaseworkerWorkload {
  username: string;
  displayName: string;
  totalCases: number;
  activeCases: number;
  escalations: number;
  byStatus: Record<string, number>;
}

interface InsightsData {
  totalCases: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byCaseworker: CaseworkerWorkload[];
  avgDaysToDecision: number | null;
  escalationCount: number;
  reminderCount: number;
  casesThisMonth: number;
  casesLastMonth: number;
  approvalRate: number | null;
  oldestOpenCase: { caseId: string; daysOpen: number } | null;
}

const STATUS_DISPLAY: Record<string, string> = {
  awaiting_evidence: "Awaiting evidence",
  evidence_requested: "Evidence requested",
  evidence_received: "Evidence received",
  under_review: "Under review",
  awaiting_assessment: "Awaiting assessment",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
  closed: "Closed",
};

const TYPE_DISPLAY: Record<string, string> = {
  dsa_application: "DSA Application",
  allowance_review: "Allowance Review",
  compliance_check: "Compliance Check",
};

const STATUS_COLOURS: Record<string, string> = {
  awaiting_evidence: "#f47738",
  evidence_requested: "#f47738",
  evidence_received: "#1d70b8",
  under_review: "#1d70b8",
  awaiting_assessment: "#912b88",
  approved: "#00703c",
  rejected: "#d4351c",
  escalated: "#d4351c",
  closed: "#505a5f",
};

function StatCard({ label, value, colour, subtext }: { label: string; value: string | number; colour?: string; subtext?: string }) {
  return (
    <div style={{ padding: "20px", border: "1px solid #b1b4b6", textAlign: "center", background: "#fff" }}>
      <p className="govuk-body-s govuk-!-margin-bottom-1" style={{ color: "#505a5f" }}>{label}</p>
      <p className="govuk-!-font-weight-bold govuk-!-margin-bottom-0" style={{ fontSize: "36px", color: colour || "#0b0c0c" }}>
        {value}
      </p>
      {subtext && <p className="govuk-body-s govuk-!-margin-bottom-0" style={{ color: "#505a5f" }}>{subtext}</p>}
    </div>
  );
}

function BarChart({ data, labels, colours }: { data: number[]; labels: string[]; colours: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "200px", padding: "10px 0" }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="govuk-body-s govuk-!-font-weight-bold" style={{ marginBottom: "4px" }}>{val}</span>
          <div style={{
            width: "100%",
            height: `${(val / max) * 160}px`,
            backgroundColor: colours[i] || "#1d70b8",
            minHeight: val > 0 ? "4px" : "0",
            borderRadius: "2px 2px 0 0",
          }} />
          <span className="govuk-body-s" style={{ marginTop: "6px", textAlign: "center", fontSize: "11px", lineHeight: "1.2" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/dashboard/insights");
        if (res.status === 401) { router.push("/dashboard/login"); return; }
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        setError("Failed to load insights.");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [router]);

  if (loading) return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper" id="main-content" role="main">
        <p className="govuk-body">Loading insights…</p>
      </main>
    </div>
  );

  if (error || !data) return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper" id="main-content" role="main">
        <div className="govuk-error-summary" role="alert"><p>{error}</p></div>
      </main>
    </div>
  );

  const statusEntries = Object.entries(data.byStatus);
  const typeEntries = Object.entries(data.byType);
  const monthChange = data.casesLastMonth > 0
    ? Math.round(((data.casesThisMonth - data.casesLastMonth) / data.casesLastMonth) * 100)
    : null;

  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper" id="main-content" role="main">
        <a href="/dashboard" className="govuk-back-link">Back to cases</a>
        <h1 className="govuk-heading-l">Insights dashboard</h1>

        {/* KPI cards */}
        <div className="govuk-grid-row" style={{ marginBottom: "30px" }}>
          <div className="govuk-grid-column-one-quarter">
            <StatCard label="Total cases" value={data.totalCases} />
          </div>
          <div className="govuk-grid-column-one-quarter">
            <StatCard
              label="This month"
              value={data.casesThisMonth}
              subtext={monthChange !== null ? `${monthChange >= 0 ? "+" : ""}${monthChange}% vs last month` : "No data last month"}
            />
          </div>
          <div className="govuk-grid-column-one-quarter">
            <StatCard
              label="Avg days to decision"
              value={data.avgDaysToDecision ?? "—"}
              colour="#1d70b8"
            />
          </div>
          <div className="govuk-grid-column-one-quarter">
            <StatCard
              label="Approval rate"
              value={data.approvalRate !== null ? `${data.approvalRate}%` : "—"}
              colour="#00703c"
            />
          </div>
        </div>

        {/* Alert cards */}
        <div className="govuk-grid-row" style={{ marginBottom: "30px" }}>
          <div className="govuk-grid-column-one-third">
            <StatCard label="Escalations (56+ days)" value={data.escalationCount} colour={data.escalationCount > 0 ? "#d4351c" : "#00703c"} />
          </div>
          <div className="govuk-grid-column-one-third">
            <StatCard label="Reminders due (28+ days)" value={data.reminderCount} colour={data.reminderCount > 0 ? "#f47738" : "#00703c"} />
          </div>
          <div className="govuk-grid-column-one-third">
            {data.oldestOpenCase ? (
              <StatCard
                label="Oldest open case"
                value={`${data.oldestOpenCase.daysOpen}d`}
                colour={data.oldestOpenCase.daysOpen > 56 ? "#d4351c" : "#f47738"}
                subtext={data.oldestOpenCase.caseId}
              />
            ) : (
              <StatCard label="Oldest open case" value="—" />
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="govuk-grid-row" style={{ marginBottom: "30px" }}>
          <div className="govuk-grid-column-two-thirds">
            <h2 className="govuk-heading-m">Cases by status</h2>
            <div style={{ border: "1px solid #b1b4b6", padding: "20px", background: "#fff" }}>
              <BarChart
                data={statusEntries.map(([, v]) => v)}
                labels={statusEntries.map(([k]) => STATUS_DISPLAY[k] || k)}
                colours={statusEntries.map(([k]) => STATUS_COLOURS[k] || "#1d70b8")}
              />
            </div>
          </div>
          <div className="govuk-grid-column-one-third">
            <h2 className="govuk-heading-m">Cases by type</h2>
            <div style={{ border: "1px solid #b1b4b6", padding: "20px", background: "#fff" }}>
              {typeEntries.map(([type, count]) => (
                <div key={type} style={{ marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span className="govuk-body-s">{TYPE_DISPLAY[type] || type}</span>
                    <span className="govuk-body-s govuk-!-font-weight-bold">{count}</span>
                  </div>
                  <div style={{ height: "8px", background: "#f3f2f1", borderRadius: "4px" }}>
                    <div style={{
                      height: "100%",
                      width: `${(count / data.totalCases) * 100}%`,
                      background: "#1d70b8",
                      borderRadius: "4px",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Caseworker workload table */}
        <h2 className="govuk-heading-m">Caseworker workload</h2>
        <table className="govuk-table">
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th scope="col" className="govuk-table__header">Caseworker</th>
              <th scope="col" className="govuk-table__header govuk-table__header--numeric">Total</th>
              <th scope="col" className="govuk-table__header govuk-table__header--numeric">Active</th>
              <th scope="col" className="govuk-table__header govuk-table__header--numeric">Escalations</th>
              <th scope="col" className="govuk-table__header">Workload</th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {data.byCaseworker.map((cw) => (
              <tr key={cw.username} className="govuk-table__row">
                <td className="govuk-table__cell">{cw.displayName}</td>
                <td className="govuk-table__cell govuk-table__cell--numeric">{cw.totalCases}</td>
                <td className="govuk-table__cell govuk-table__cell--numeric">{cw.activeCases}</td>
                <td className="govuk-table__cell govuk-table__cell--numeric">
                  {cw.escalations > 0 ? (
                    <strong className="govuk-tag govuk-tag--red">{cw.escalations}</strong>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="govuk-table__cell" style={{ minWidth: "200px" }}>
                  <div style={{ display: "flex", gap: "2px", height: "20px" }}>
                    {Object.entries(cw.byStatus).map(([status, count]) => (
                      <div
                        key={status}
                        title={`${STATUS_DISPLAY[status] || status}: ${count}`}
                        style={{
                          width: `${(count / cw.totalCases) * 100}%`,
                          backgroundColor: STATUS_COLOURS[status] || "#b1b4b6",
                          borderRadius: "2px",
                          minWidth: count > 0 ? "4px" : "0",
                        }}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
          {Object.entries(STATUS_COLOURS).map(([status, colour]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: colour, borderRadius: "2px" }} />
              <span className="govuk-body-s govuk-!-margin-bottom-0">{STATUS_DISPLAY[status] || status}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}