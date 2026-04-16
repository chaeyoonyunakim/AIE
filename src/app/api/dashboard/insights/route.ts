import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { readCases, readUsers } from "@/lib/data-store";
import { sessionOptions, SessionData } from "@/lib/session";
import type { Case, WorkflowStateName } from "@/types";

interface CaseworkerWorkload {
  username: string;
  displayName: string;
  totalCases: number;
  activeCases: number;
  escalations: number;
  byStatus: Record<string, number>;
}

interface InsightsResponse {
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

function daysBetween(from: string, to: string): number {
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function evidenceDaysOutstanding(c: Case, now: Date): number | null {
  if (
    (c.status !== "awaiting_evidence" && c.status !== "evidence_requested") ||
    !c.evidence_requested_date
  ) return null;
  return Math.floor((now.getTime() - new Date(c.evidence_requested_date).getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.username) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const cases = readCases();
    const users = readUsers();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // By status
    const byStatus: Record<string, number> = {};
    for (const c of cases) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    // By type
    const byType: Record<string, number> = {};
    for (const c of cases) {
      byType[c.case_type] = (byType[c.case_type] || 0) + 1;
    }

    // By caseworker
    const cwMap = new Map<string, Case[]>();
    for (const c of cases) {
      const arr = cwMap.get(c.assigned_to) || [];
      arr.push(c);
      cwMap.set(c.assigned_to, arr);
    }

    const terminalStates: WorkflowStateName[] = ["approved", "rejected", "closed"];
    const byCaseworker: CaseworkerWorkload[] = [];
    for (const [username, userCases] of cwMap) {
      const user = users.find((u) => u.username === username);
      const statusCounts: Record<string, number> = {};
      let escalations = 0;
      for (const c of userCases) {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        const days = evidenceDaysOutstanding(c, now);
        if (days !== null && days >= 56) escalations++;
      }
      byCaseworker.push({
        username,
        displayName: user?.display_name || username,
        totalCases: userCases.length,
        activeCases: userCases.filter((c) => !terminalStates.includes(c.status)).length,
        escalations,
        byStatus: statusCounts,
      });
    }
    byCaseworker.sort((a, b) => b.activeCases - a.activeCases);

    // Avg days to decision
    const decidedCases = cases.filter((c) => c.status === "approved" || c.status === "rejected");
    let avgDaysToDecision: number | null = null;
    if (decidedCases.length > 0) {
      const totalDays = decidedCases.reduce((sum, c) => sum + daysBetween(c.created_date, c.last_updated), 0);
      avgDaysToDecision = Math.round(totalDays / decidedCases.length);
    }

    // Escalation & reminder counts
    let escalationCount = 0;
    let reminderCount = 0;
    for (const c of cases) {
      const days = evidenceDaysOutstanding(c, now);
      if (days !== null) {
        if (days >= 56) escalationCount++;
        else if (days >= 28) reminderCount++;
      }
    }

    // Cases this month / last month
    const casesThisMonth = cases.filter((c) => new Date(c.created_date) >= thisMonthStart).length;
    const casesLastMonth = cases.filter((c) => {
      const d = new Date(c.created_date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    // Approval rate
    let approvalRate: number | null = null;
    if (decidedCases.length > 0) {
      const approved = decidedCases.filter((c) => c.status === "approved").length;
      approvalRate = Math.round((approved / decidedCases.length) * 100);
    }

    // Oldest open case
    const openCases = cases.filter((c) => !terminalStates.includes(c.status));
    let oldestOpenCase: { caseId: string; daysOpen: number } | null = null;
    if (openCases.length > 0) {
      const oldest = openCases.reduce((prev, curr) =>
        new Date(prev.created_date) < new Date(curr.created_date) ? prev : curr
      );
      oldestOpenCase = {
        caseId: oldest.case_id,
        daysOpen: daysBetween(oldest.created_date, now.toISOString()),
      };
    }

    const response: InsightsResponse = {
      totalCases: cases.length,
      byStatus,
      byType,
      byCaseworker,
      avgDaysToDecision,
      escalationCount,
      reminderCount,
      casesThisMonth,
      casesLastMonth,
      approvalRate,
      oldestOpenCase,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
