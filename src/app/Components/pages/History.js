import React, { useMemo } from "react";
import { Container } from "react-bootstrap";
import { ClockHistory, Download, PencilSquare, Search } from "react-bootstrap-icons";
import { useSelector } from "react-redux";

import { selectHistory } from "../../features/api/historySlice";
import { selectStock } from "../../features/stock/stockSlice";
import HistoryTable from "../tables/HistoryTable";
import "./WorkspacePages.css";

const EMPTY_ARRAY = [];

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

const HistoryPage = () => {
  const inventory = useSelector(selectStock) ?? EMPTY_ARRAY;
  const history = useSelector(selectHistory) ?? EMPTY_ARRAY;

  const totals = useMemo(() => {
    const itemIds = new Set(history.map((item) => item.historyItemId));
    const actionMap = history.reduce((acc, item) => {
      const key = item.historyAction || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topActionEntry = Object.entries(actionMap).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEvents: history.length,
      affectedItems: itemIds.size,
      trackedProducts: inventory.length,
      topAction: topActionEntry ? `${topActionEntry[0]} (${topActionEntry[1]})` : "No activity yet",
    };
  }, [history, inventory.length]);

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">History Workspace</h2>
            <p className="workspace-page-subtitle">
              Review every stock event, audit item changes, and export activity logs from one organized timeline.
            </p>
          </div>
        </header>

        <div className="workspace-metric-grid">
          <MetricCard
            icon={<ClockHistory size={18} />}
            title="History Events"
            value={totals.totalEvents}
            note="All tracked history records"
            accent={palette.greenSoft}
            color={palette.green}
          />
          <MetricCard
            icon={<Search size={18} />}
            title="Affected Items"
            value={totals.affectedItems}
            note="Unique products appearing in history"
            accent={palette.blueSoft}
            color={palette.blue}
          />
          <MetricCard
            icon={<Download size={18} />}
            title="Tracked Products"
            value={totals.trackedProducts}
            note="Products currently available in inventory"
            accent={palette.amberSoft}
            color={palette.amber}
          />
          <MetricCard
            icon={<PencilSquare size={18} />}
            title="Top Action"
            value={totals.topAction}
            note="Most common recent activity label"
            accent={palette.greenSoft}
            color={palette.green}
          />
        </div>

        <HistoryTable historyData={history} itemsData={inventory} companyName="Ampla Uganda" />
      </div>
    </Container>
  );
};

export default HistoryPage;
