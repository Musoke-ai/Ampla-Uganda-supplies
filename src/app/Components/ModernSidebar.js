import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  BarChartLine,
  BoxSeam,
  ChatDots,
  ClipboardData,
  DoorOpen,
  Buildings,
  Grid,
  HouseDoor,
  People,
  Receipt,
  Shop,
  Tools,
} from "react-bootstrap-icons";
import { Link, useLocation } from "react-router-dom";
import { useSettings } from "./Settings";

const drawerWidth = 236;
const collapsedDrawerWidth = 92;
const AMPLA_LOGO_SRC = `${process.env.PUBLIC_URL || ""}/logos/ampla_logo.png`;

const palette = {
  sidebar: "#f4faf6",
  sidebarBorder: "#e7f1ea",
  active: "#dff2e6",
  activeStrong: "#2f8f57",
  text: "#15202b",
  muted: "#697586",
  section: "#6d7a88",
};

const ALL_APP_ROLES = [
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
];

const ROLE_GROUPS = {
  dashboard: ["admin", "dashboard"],
  production: [
    "admin",
    "rawmaterials",
    "expenses",
    "orders",
    "employees",
    "batches",
    "categories",
    "productionmanager",
    "productionmanger",
  ],
  inventory: ["admin", "products", "inventorymanager", "productionmanger"],
  stock: ["admin", "stock", "inventorymanager", "productionmanager", "productionmanger"],
  customers: ["admin", "customers", "accountant"],
  sales: ["admin", "sales", "accountant"],
  reports: ["admin", "reports", "accountant"],
  pos: ["admin", "salesdesk", "accountant"],
  history: ["admin", "history", "accountant"],
  settings: ALL_APP_ROLES,
  branches: ["admin"],
  documents: ["admin"],
  assistant: ALL_APP_ROLES,
};

const navGroups = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/home/dashboard", icon: HouseDoor },
      { id: "production", label: "Production", path: "/home/production", icon: Tools },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "inventory", label: "Products", path: "/home/inventory", icon: BoxSeam },
      { id: "stock", label: "Stock", path: "/home/stock", icon: Grid },
      { id: "customers", label: "Customers", path: "/home/customers", icon: People },
      { id: "branches", label: "Branches", path: "/home/branches", icon: Buildings },
      { id: "sales", label: "Sales", path: "/home/sales", icon: Shop },
    ],
  },
  {
    title: "Insights",
    items: [
      { id: "reports", label: "Reports", path: "/home/reports", icon: BarChartLine },
      { id: "assistant", label: "AI Assistant", path: "/home/assistant", icon: ChatDots },
      { id: "history", label: "History", path: "/home/history", icon: ClipboardData },
      { id: "documents", label: "Documents", path: "/home/documents", icon: Receipt },
    ],
  },
];

const canAccess = (requiredRoles = [], currentRoles = []) =>
  requiredRoles.some((role) => currentRoles.includes(role));

const itemStyles = (active, compact, uiPalette) => ({
  minHeight: 42,
  borderRadius: 3,
  px: compact ? 1 : 1.5,
  mb: 0.5,
  justifyContent: compact ? "center" : "flex-start",
  color: active ? uiPalette.activeStrong : uiPalette.text,
  bgcolor: active ? uiPalette.active : "transparent",
  "&:hover": {
    bgcolor: active ? uiPalette.active : alpha(uiPalette.activeStrong, 0.08),
  },
});

const ModernSidebar = ({
  onLogout = () => {},
  roles = [],
  profile = {},
  mobileOpen = false,
  onMobileClose = () => {},
  collapsed = false,
}) => {
  const { settings } = useSettings();
  const location = useLocation();
  const businessName = profile?.busName || "AMPLA UGANDA";
  const isDark = settings?.theme === "dark";
  const accent = settings?.navbarColor || palette.activeStrong;
  const sidebarBackground = isDark
    ? "#101715"
    : settings?.sidebarColor || palette.sidebar;

  const uiPalette = useMemo(
    () => ({
      sidebar: sidebarBackground,
      sidebarBorder: isDark ? alpha(accent, 0.18) : alpha(accent, 0.12),
      active: isDark ? alpha(accent, 0.18) : alpha(accent, 0.12),
      activeStrong: accent,
      text: isDark ? "#edf3ef" : palette.text,
      muted: isDark ? "#a3b2ac" : palette.muted,
      section: isDark ? "#8da199" : palette.section,
      surface: isDark ? alpha("#ffffff", 0.04) : alpha("#ffffff", 0.72),
      highlight: isDark ? alpha(accent, 0.12) : alpha(accent, 0.08),
    }),
    [accent, isDark, sidebarBackground]
  );

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            canAccess(ROLE_GROUPS[item.id] ?? ["admin"], roles)
          ),
        }))
        .filter((group) => group.items.length > 0),
    [roles]
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderNavItem = (item, compact) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const button = (
      <ListItemButton
        component={Link}
        to={item.path}
        onClick={onMobileClose}
        title={compact ? item.label : undefined}
        sx={itemStyles(active, compact, uiPalette)}
      >
        <ListItemIcon
          sx={{
            minWidth: compact ? 0 : 34,
            mr: compact ? 0 : undefined,
            justifyContent: "center",
            color: active ? uiPalette.activeStrong : uiPalette.muted,
          }}
        >
          <Icon size={17} />
        </ListItemIcon>
        {!compact && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: "0.95rem",
              fontWeight: active ? 700 : 500,
            }}
          />
        )}
      </ListItemButton>
    );

    if (!compact) {
      return <React.Fragment key={item.id}>{button}</React.Fragment>;
    }

    return (
      <Tooltip key={item.id} title={item.label} placement="right">
        {button}
      </Tooltip>
    );
  };

  const content = (compact = false) => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: uiPalette.sidebar,
        borderRight: `1px solid ${uiPalette.sidebarBorder}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: compact ? 1.25 : 2,
          pt: 2.5,
          pb: compact ? 1.25 : 1.75,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={compact ? 0 : 1.5}
          alignItems="center"
          justifyContent={compact ? "center" : "flex-start"}
        >
          <Box
            component="img"
            src={AMPLA_LOGO_SRC}
            alt="Ampla Uganda"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              objectFit: "cover",
              border: `1px solid ${uiPalette.sidebarBorder}`,
              boxShadow: isDark
                ? "0 10px 22px rgba(0,0,0,0.24)"
                : "0 10px 22px rgba(47,143,87,0.14)",
              flexShrink: 0,
            }}
          />
          {!compact && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: uiPalette.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {businessName}
              </Typography>
              <Typography variant="caption" sx={{ color: uiPalette.muted }}>
                Operations Workspace
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {!compact && (
        <Box sx={{ px: 1.5, pb: 2, flexShrink: 0 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: uiPalette.highlight,
              border: `1px solid ${uiPalette.sidebarBorder}`,
            }}
          >
            <Typography variant="body2" sx={{ color: uiPalette.activeStrong, fontWeight: 700 }}>
              Focus Today
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: uiPalette.text, lineHeight: 1.55 }}>
              Keep inventory, sales, and production in one rhythm.
            </Typography>
          </Box>
        </Box>
      )}

      <List
        sx={{
          px: compact ? 1 : 1.5,
          pt: 0,
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha(accent, 0.36)} transparent`,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 999,
            backgroundColor: alpha(accent, 0.28),
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        {visibleGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.5 }}>
            {!compact && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.5,
                  pb: 0.8,
                  color: uiPalette.section,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {group.title}
              </Typography>
            )}
            {group.items.map((item) => renderNavItem(item, compact))}
          </Box>
        ))}
      </List>

      <Box sx={{ px: compact ? 1 : 1.5, pb: 1.5, flexShrink: 0 }}>
        {canAccess(ROLE_GROUPS.pos, roles) && (
          <Tooltip title={compact ? "Sales Desk" : ""} placement="right" disableHoverListener={!compact}>
            <ListItemButton
              component={Link}
              to="/home/pos"
              onClick={onMobileClose}
              title={compact ? "Sales Desk" : undefined}
              sx={{
                minHeight: 48,
                borderRadius: 3,
                px: compact ? 1 : 1.75,
                justifyContent: compact ? "center" : "flex-start",
                mb: 1,
                bgcolor: uiPalette.activeStrong,
                color: "#ffffff",
                boxShadow: "0 10px 25px rgba(47, 143, 87, 0.22)",
                "&:hover": {
                  bgcolor: "#2a814e",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: compact ? 0 : 34,
                  mr: compact ? 0 : undefined,
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <Shop size={17} />
              </ListItemIcon>
              {!compact && (
                <>
                  <ListItemText
                    primary="Sales Desk"
                    primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 700 }}
                  />
                  <Chip
                    label="Live"
                    size="small"
                    sx={{
                      height: 24,
                      fontWeight: 700,
                      bgcolor: alpha("#ffffff", 0.24),
                      color: "#ffffff",
                    }}
                  />
                </>
              )}
            </ListItemButton>
          </Tooltip>
        )}

        <Tooltip title={compact ? "Logout" : ""} placement="right" disableHoverListener={!compact}>
          <ListItemButton
            onClick={onLogout}
            title={compact ? "Logout" : undefined}
            sx={{
              minHeight: 44,
              borderRadius: 3,
              px: compact ? 1 : 1.75,
              justifyContent: compact ? "center" : "flex-start",
              color: uiPalette.text,
              bgcolor: uiPalette.surface,
              "&:hover": {
                bgcolor: uiPalette.highlight,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: compact ? 0 : 34,
                mr: compact ? 0 : undefined,
                justifyContent: "center",
                color: uiPalette.muted,
              }}
            >
              <DoorOpen size={17} />
            </ListItemIcon>
            {!compact && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 500 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: uiPalette.sidebarBorder, flexShrink: 0 }} />
      <Box
        sx={{
          px: compact ? 1.25 : 2,
          py: 2,
          textAlign: compact ? "center" : "left",
          flexShrink: 0,
        }}
      >
        {!compact && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <Box
              component="img"
              src="/madeBy/ugflag.gif"
              alt="Uganda flag"
              sx={{
                width: 24,
                height: 16,
                borderRadius: 0.75,
                objectFit: "cover",
                border: `1px solid ${uiPalette.sidebarBorder}`,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ color: uiPalette.text, fontWeight: 700 }}>
              Proudly Uganda
            </Typography>
          </Stack>
        )}
        <Typography variant="caption" sx={{ color: uiPalette.muted, display: "block" }}>
          {compact ? "2026" : "(c) 2026 Ampla Uganda"}
        </Typography>
        {!compact && (
          <Typography variant="caption" sx={{ color: uiPalette.muted }}>
            All rights reserved
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            border: "none",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
          },
        }}
      >
        {content(false)}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", lg: "block" },
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          transition: "width 0.24s ease",
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            border: "none",
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: "width 0.24s ease",
          },
        }}
      >
        {content(collapsed)}
      </Drawer>
    </>
  );
};

export default ModernSidebar;
