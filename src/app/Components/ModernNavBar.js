import React, { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowClockwise, Bell, Calendar3, ChatDots, ChevronLeft, ChevronRight, Gear, List, People, Power, QuestionCircle, SignpostSplit, ThreeDotsVertical } from "react-bootstrap-icons";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSettings } from "./Settings";
import BranchScopeSwitcher from "./BranchScopeSwitcher";
import { selectBranchScope } from "../auth/authSlice";
import { apiSlice } from "../features/api/apiSlice";
import {
  selectBranches,
  useGetBranchesQuery,
} from "../features/api/branchesSlice";

const EMPTY_ARRAY = [];

const palette = {
  white: "#ffffff",
  bg: "#f8fbf8",
  border: "#edf2ee",
  text: "#15202b",
  muted: "#697586",
  green: "#2f8f57",
  chip: "#ecf7f0",
};

const ModernNavBar = ({
  profile = {},
  notifications = 0,
  onLogout = () => {},
  onMenuToggle = () => {},
  sidebarCollapsed = false,
  onSidebarToggle = () => {},
  hiddenOnCompactScroll = false,
}) => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const branchScope = useSelector(selectBranchScope);
  const branches = useSelector(selectBranches) ?? EMPTY_ARRAY;
  useGetBranchesQuery();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [workspaceAnchor, setWorkspaceAnchor] = useState(null);
  const isDark = settings?.theme === "dark";
  const accent = settings?.navbarColor || palette.green;
  const surface = isDark ? alpha("#111917", 0.92) : palette.white;
  const borderColor = isDark ? alpha(accent, 0.22) : alpha(accent, 0.12);
  const textColor = isDark ? "#edf3ef" : palette.text;
  const mutedColor = isDark ? "#a3b2ac" : palette.muted;
  const barBackground = isDark ? alpha("#0f1614", 0.92) : alpha(accent, 0.1);
  const chipBackground = isDark ? alpha(accent, 0.18) : palette.chip;
  const effectiveBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";
  const currentBranchName = useMemo(() => {
    const match = branches.find(
      (branch) => String(branch?.branchId) === String(effectiveBranchId)
    );

    return match?.branchName || (effectiveBranchId ? `Branch #${effectiveBranchId}` : "All Branches");
  }, [branches, effectiveBranchId]);
  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);
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

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        bgcolor: barBackground,
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: "none",
        zIndex: (theme) => theme.zIndex.drawer + 2,
        transform: {
          xs: hiddenOnCompactScroll ? "translateY(-110%)" : "translateY(0)",
          lg: "translateY(0)",
        },
        opacity: {
          xs: hiddenOnCompactScroll ? 0 : 1,
          lg: 1,
        },
        pointerEvents: {
          xs: hiddenOnCompactScroll ? "none" : "auto",
          lg: "auto",
        },
        transition: "transform 220ms ease, opacity 180ms ease, background-color 180ms ease",
        willChange: "transform",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 60,
          px: { xs: 2, md: 3 },
          py: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 auto",
            minWidth: 0,
            gap: 1.5,
          }}
        >
          <IconButton
            onClick={onMenuToggle}
            sx={{
              display: { xs: "inline-flex", lg: "none" },
              border: `1px solid ${borderColor}`,
              bgcolor: surface,
              color: textColor,
            }}
          >
            <List size={20} />
          </IconButton>

          <IconButton
            onClick={onSidebarToggle}
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              border: `1px solid ${borderColor}`,
              bgcolor: surface,
              color: textColor,
            }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>

          <Box
            aria-label="Page history controls"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              alignItems: "center",
              gap: 0.5,
              p: 0.35,
              borderRadius: 999,
              bgcolor: surface,
              border: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}
          >
            <IconButton
              onClick={goBack}
              size="small"
              title="Go back"
              aria-label="Go back"
              sx={{ color: textColor }}
            >
              <ChevronLeft size={17} />
            </IconButton>
            <IconButton
              onClick={goForward}
              size="small"
              title="Go forward"
              aria-label="Go forward"
              sx={{ color: textColor }}
            >
              <ChevronRight size={17} />
            </IconButton>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: textColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Operations Workspace
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: mutedColor,
                mt: 0.25,
                display: { xs: "none", md: "block" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Monitor stock, sales, and production from one live workspace.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            flex: "0 0 auto",
            ml: "auto",
          }}
        >
          <Button
            onClick={() => navigate("/home/assistant")}
            startIcon={<ChatDots size={15} />}
            sx={{
              display: { xs: "none", xl: "inline-flex" },
              minHeight: 40,
              px: 1.5,
              borderRadius: 999,
              bgcolor: surface,
              color: accent,
              border: `1px solid ${borderColor}`,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                bgcolor: chipBackground,
                borderColor: borderColor,
              },
            }}
          >
            Try Ampla Copilot
          </Button>

          <Chip
            icon={<SignpostSplit size={15} />}
            label={`Branch: ${currentBranchName}`}
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              maxWidth: 220,
              height: 40,
              px: 1,
              bgcolor: surface,
              color: accent,
              borderRadius: 999,
              fontWeight: 700,
              border: `1px solid ${borderColor}`,
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
              "& .MuiChip-icon": {
                color: accent,
              },
            }}
          />

          <Chip
            icon={<Calendar3 size={15} />}
            label={format(new Date(), "EEE, MMM dd yyyy")}
            sx={{
              display: { xs: "none", xl: "inline-flex" },
              height: 40,
              px: 1,
              bgcolor: chipBackground,
              color: accent,
              borderRadius: 999,
              fontWeight: 700,
              border: `1px solid ${borderColor}`,
              "& .MuiChip-icon": {
                color: accent,
              },
            }}
          />

          <IconButton
            onClick={refreshWorkspaceData}
            sx={{
              width: 40,
              height: 40,
              bgcolor: surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <ArrowClockwise size={17} />
          </IconButton>

          <IconButton
            onClick={(event) => setWorkspaceAnchor(event.currentTarget)}
            sx={{
              width: 40,
              height: 40,
              bgcolor: surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
            title="Workspace actions"
          >
            <ThreeDotsVertical size={17} />
          </IconButton>

          <IconButton
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
            sx={{
              width: 40,
              height: 40,
              bgcolor: surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          >
            <Badge badgeContent={notifications} color="error">
              <Bell size={17} />
            </Badge>
          </IconButton>

          <Box
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: surface,
              border: `1px solid ${borderColor}`,
              cursor: "pointer",
              maxWidth: { xs: 48, md: 210 },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: alpha(accent, isDark ? 0.24 : 0.14),
                color: accent,
                fontWeight: 800,
              }}
            >
              {(profile?.busName || profile?.userName || "A").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: textColor }}>
                {profile?.busName || "AMPLA UGANDA"}
              </Typography>
              <Typography variant="caption" sx={{ color: mutedColor }}>
                {profile?.userRole || "admin"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={workspaceAnchor}
          open={Boolean(workspaceAnchor)}
          onClose={() => setWorkspaceAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              width: { xs: 320, sm: 420 },
              maxWidth: "calc(100vw - 24px)",
              borderRadius: 3,
              border: `1px solid ${borderColor}`,
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
              bgcolor: surface,
              color: textColor,
              p: 1,
            },
          }}
        >
          <Box sx={{ px: 1, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
              Workspace
            </Typography>
            <BranchScopeSwitcher />
          </Box>
          <Divider sx={{ my: 1 }} />
          <MenuItem
            onClick={() => {
              setWorkspaceAnchor(null);
              navigate("/home/assistant");
            }}
            sx={{ gap: 1.2, py: 1.2, borderRadius: 2 }}
          >
            <ChatDots size={16} />
            <Typography variant="body2">Open Ampla Copilot</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setWorkspaceAnchor(null);
              navigate("/home/help");
            }}
            sx={{ gap: 1.2, py: 1.2, borderRadius: 2 }}
          >
            <QuestionCircle size={16} />
            <Typography variant="body2">Open Help Guide</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setWorkspaceAnchor(null);
              navigate("/home/staff");
            }}
            sx={{ gap: 1.2, py: 1.2, borderRadius: 2 }}
          >
            <People size={16} />
            <Typography variant="body2">Staff Management</Typography>
          </MenuItem>
          <MenuItem disabled sx={{ gap: 1.2, py: 1.2, borderRadius: 2 }}>
            <Calendar3 size={16} />
            <Typography variant="body2">{format(new Date(), "EEE, MMM dd yyyy")}</Typography>
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={() => setNotificationAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 3,
              border: `1px solid ${borderColor}`,
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
              bgcolor: surface,
              color: textColor,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textColor }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: mutedColor, mt: 0.25 }}>
              No new alerts right now.
            </Typography>
          </Box>
        </Menu>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 3,
              border: `1px solid ${borderColor}`,
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
              bgcolor: surface,
              color: textColor,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textColor }}>
              {profile?.userName || profile?.busName || "Account"}
            </Typography>
            <Typography variant="body2" sx={{ color: mutedColor, mt: 0.25 }}>
              {profile?.busEmail || profile?.userEmail || "Workspace settings"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              navigate("/home/settings");
            }}
            sx={{ gap: 1.2, py: 1.2 }}
          >
            <Gear size={16} />
            <Typography variant="body2">Settings</Typography>
          </MenuItem>
          <MenuItem onClick={onLogout} sx={{ gap: 1.2, py: 1.2, color: "#ca5252" }}>
            <Power size={16} />
            <Typography variant="body2">Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default ModernNavBar;
