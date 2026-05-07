import React, { useMemo } from "react";
import { Container } from "react-bootstrap";
import { FileEarmarkText, Files, Printer, Receipt } from "react-bootstrap-icons";
import { useSelector } from "react-redux";

import Invoice from "../../documents/Invoice";
import { selectSales } from "../../features/api/salesSlice";
import "./WorkspacePages.css";

const palette = {
  surface: "#ffffff",
  border: "#e7efe9",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: palette.surface,
  boxShadow: palette.shadow,
  border: `1px solid ${palette.border}`,
};

function MetricCard({ icon, title, value, note, accent, color }) {
  return (
    <div className="workspace-metric-card" style={sectionCardStyle}>
      <div className="workspace-metric-icon" style={{ backgroundColor: accent, color }}>
        {icon}
      </div>
      <div className="workspace-metric-body">
        <div className="workspace-metric-title">{title}</div>
        <div className="workspace-metric-value">{value}</div>
        <div className="workspace-metric-note">{note}</div>
      </div>
    </div>
  );
}

const Documents = () => {
  const sales = useSelector(selectSales) ?? [];

  const metrics = useMemo(() => {
    const receiptIds = [...new Set(sales.map((sale) => Number(sale.SR_ID)).filter(Boolean))];
    return {
      receipts: receiptIds.length,
      salesRows: sales.length,
      latestReceipt: receiptIds[receiptIds.length - 1] || "N/A",
    };
  }, [sales]);

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Documents Workspace</h2>
            <p className="workspace-page-subtitle">
              Manage receipts, preview printable documents, and move through saved sales records from one calm workspace.
            </p>
          </div>
        </header>

        <div className="workspace-metric-grid">
          <MetricCard
            icon={<Receipt size={18} />}
            title="Saved Receipts"
            value={metrics.receipts}
            note="Unique receipt groups available to preview"
            accent={palette.greenSoft}
            color={palette.green}
          />
          <MetricCard
            icon={<Files size={18} />}
            title="Sales Rows"
            value={metrics.salesRows}
            note="Individual sale lines connected to receipts"
            accent={palette.blueSoft}
            color={palette.blue}
          />
          <MetricCard
            icon={<FileEarmarkText size={18} />}
            title="Latest Receipt"
            value={metrics.latestReceipt}
            note="Most recently available receipt number"
            accent={palette.amberSoft}
            color={palette.amber}
          />
          <MetricCard
            icon={<Printer size={18} />}
            title="Print Ready"
            value="Receipt"
            note="Sales receipt preview and export workflow"
            accent={palette.greenSoft}
            color={palette.green}
          />
        </div>

        <div className="workspace-document-shell" style={sectionCardStyle}>
          <Invoice />
        </div>
      </div>
    </Container>
  );
};

export default Documents;
