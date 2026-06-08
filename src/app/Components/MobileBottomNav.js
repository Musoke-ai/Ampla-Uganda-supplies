import React, { useMemo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowClockwise, BoxSeam, CashStack, ChatDots, ChevronLeft, ChevronRight, HouseDoor, Shop } from "react-bootstrap-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSettings } from "./Settings";
import { apiSlice } from "../features/api/apiSlice";

const ROLE_GROUPS = {
  dashboard: ["admin", "dashboard"],
  inventory: ["admin", "products", "inventorymanager", "productionmanger"],
  pos: ["admin", "salesdesk", "accountant"],
  sales: ["admin", "sales", "accountant"],
  assistant: [
    "superadmin",
    "developer",
    "admin",
    "dashboard",
    "rawmaterials",
    "expenses",
    "orders",
    "employees",
    "batches",
    "categories",
    "products",
    "stock",
    "customers",
    "sales",
    "creditsales",
    "reports",
    "salesdesk",
    "history",
    "settings",
    "productionmanager",
    "productionmanger",
    "inventorymanager",
    "accountant",
  ],
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", path: "/home/dashboard", icon: HouseDoor },
  { id: "inventory", label: "Products", path: "/home/inventory", icon: BoxSeam },
  { id: "pos", label: "POS", path: "/home/pos", icon: Shop, center: true },
  { id: "sales", label: "Sales", path: "/home/sales", icon: CashStack },
  { id: "assistant", label: "Copilot", path: "/home/assistant", icon: ChatDots },
];

const canAccess = (requiredRoles = [], currentRoles = []) =>
  requiredRoles.some((role) => currentRoles.includes(role));

export default function MobileBottomNav({ roles = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { settings } = useSettings();
  const isDark = settings?.theme === "dark";
  const accent = settings?.navbarColor || "#2f8f57";
  const surface = isDark ? alpha("#111917", 0.96) : "rgba(255,255,255,0.96)";
  const border = isDark ? alpha("#ffffff", 0.12) : alpha(accent, 0.16);
  const muted = isDark ? "#a3b2ac" : "#64748b";
  const text = isDark ? "#edf3ef" : "#14231b";

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(ROLE_GROUPS[item.id] ?? [], roles)),
    [roles]
  );
  const refreshWorkspaceData = () => {
    dispatch(
      apiSlice.util.invalidateTags([
        "inventory",
        "profile",
        "CashDrawers",
        "Imports",
        "Accounts",
        "Notifications",
      ])
    );
  };

  if (!visibleItems.length) return null;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <Box
        aria-label="Mobile page history controls"
        sx={{
          display: { xs: "inline-flex", lg: "none" },
          position: "fixed",
          left: 16,
          bottom: "calc(92px + env(safe-area-inset-bottom))",
          zIndex: 1248,
          alignItems: "center",
          gap: 0.5,
          p: 0.45,
          borderRadius: 999,
          bgcolor: surface,
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 12px 28px rgba(0,0,0,0.36)"
            : "0 12px 28px rgba(15,23,42,0.16)",
          backdropFilter: "blur(16px)",
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          title="Go back"
          sx={{ color: text, width: 36, height: 36 }}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <IconButton
          size="small"
          onClick={refreshWorkspaceData}
          aria-label="Refresh data"
          title="Refresh data"
          sx={{ color: text, width: 36, height: 36 }}
        >
          <ArrowClockwise size={16} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => navigate(1)}
          aria-label="Go forward"
          title="Go forward"
          sx={{ color: text, width: 36, height: 36 }}
        >
          <ChevronRight size={18} />
        </IconButton>
      </Box>

      <Box
        component="nav"
        aria-label="Mobile primary navigation"
        sx={{
          display: { xs: "block", lg: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1250,
          px: 1.25,
          pt: 0.75,
          pb: "calc(0.75rem + env(safe-area-inset-bottom))",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            maxWidth: 560,
            mx: "auto",
            minHeight: 68,
            px: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
            alignItems: "center",
            gap: 0.25,
            borderRadius: 4,
            bgcolor: surface,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? "0 18px 42px rgba(0,0,0,0.42)"
              : "0 18px 42px rgba(15,23,42,0.18)",
            backdropFilter: "blur(18px)",
            pointerEvents: "auto",
          }}
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Box
                key={item.id}
                component={Link}
                to={item.path}
                aria-current={active ? "page" : undefined}
                sx={{
                  minWidth: 0,
                  height: item.center ? 78 : 58,
                  mt: item.center ? -2.2 : 0,
                  borderRadius: item.center ? "999px" : 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  color: item.center ? "#ffffff" : active ? accent : muted,
                  bgcolor: item.center
                    ? accent
                    : active
                      ? alpha(accent, isDark ? 0.2 : 0.12)
                      : "transparent",
                  textDecoration: "none",
                  boxShadow: item.center ? `0 14px 30px ${alpha(accent, 0.34)}` : "none",
                  border: item.center ? `4px solid ${surface}` : "1px solid transparent",
                  transition: "transform 160ms ease, background-color 160ms ease, color 160ms ease",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                <Icon size={item.center ? 24 : 19} />
                <Typography
                  component="span"
                  sx={{
                    maxWidth: "100%",
                    px: 0.25,
                    color: item.center ? "#ffffff" : active ? accent : text,
                    fontSize: item.center ? "0.72rem" : "0.68rem",
                    fontWeight: item.center || active ? 900 : 800,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
