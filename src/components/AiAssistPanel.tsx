"use client";

import { useState, useEffect } from "react";

interface AssistData {
  heading: string;
  guidance: string;
  tips: string[];
  suggestions?: string[];
  isAiGenerated: true;
}

interface AiAssistPanelProps {
  page: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function AiAssistPanel({ page, onSuggestionClick }: AiAssistPanelProps) {
  const [data, setData] = useState<AssistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchGuidance() {
      setLoading(true);
      try {
        const res = await fetch("/api/apply/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page }),
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Non-critical — just don't show the panel
      } finally {
        setLoading(false);
      }
    }
    fetchGuidance();
  }, [page]);

  if (loading || !data) return null;

  return (
    <div style={{
      border: "2px solid #1d70b8",
      borderRadius: "0",
      marginBottom: "30px",
      background: "#f3f2f1",
    }}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          background: "#1d70b8",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          fontFamily: "inherit",
        }}
      >
        <span>
          <span aria-hidden="true" style={{ marginRight: "8px" }}>💡</span>
          {data.heading}
          <span style={{
            marginLeft: "10px",
            fontSize: "12px",
            background: "rgba(255,255,255,0.2)",
            padding: "2px 8px",
            borderRadius: "2px",
          }}>
            AI-generated
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: "20px" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Content — collapsible */}
      {expanded && (
        <div style={{ padding: "20px" }}>
          <p className="govuk-body">{data.guidance}</p>

          <h3 className="govuk-heading-s" style={{ marginTop: "15px" }}>Tips</h3>
          <ul className="govuk-list govuk-list--bullet">
            {data.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          {data.suggestions && data.suggestions.length > 0 && onSuggestionClick && (
            <>
              <h3 className="govuk-heading-s" style={{ marginTop: "15px" }}>
                Common items students claim for
              </h3>
              <p className="govuk-body-s" style={{ color: "#505a5f" }}>
                Click to add as a cost item description
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {data.suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSuggestionClick(s)}
                    className="govuk-tag govuk-tag--blue"
                    style={{
                      cursor: "pointer",
                      border: "none",
                      fontSize: "14px",
                      padding: "5px 12px",
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
