import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import { tags as commonTags } from "../../features/api/commonTags";
import { PUSHER_DISCONNECT, PUSHER_SUBSCRIBE } from "../../features/api/pusherMiddleware";
import { selectProfile, selectRoles, logOut } from "../../auth/authSlice";
import { useSendLogoutMutation } from "../../auth/authApiSlice";
import {
  selectNotifications,
  useGetNotificationsQuery,
} from "../../features/api/notificationsSlice";
import ModernSidebar from "../ModernSidebar";
import ModernNavBar from "../ModernNavBar";
import MobileBottomNav from "../MobileBottomNav";
import FloatingHelpBubble from "../FloatingHelpBubble";
import { useSettings } from "../Settings";

const EMPTY_ARRAY = [];

const subscriptions = [
  {
    channel: "stock-channel",
    tag: commonTags.inventory,
    events: ["stock-created", "stock-updated", "stock-deleted"],
  },
  {
    channel: "customers-channel",
    tag: commonTags.inventory,
    events: ["customer-created", "customer-updated", "customer-deleted"],
  },
  {
    channel: "branches-channel",
    tag: commonTags.inventory,
    events: ["branch-created", "branch-updated", "branch-deleted"],
  },
  {
    channel: "employees-channel",
    tag: commonTags.inventory,
    events: ["employee-created", "employee-updated", "employee-deleted"],
  },
  {
    channel: "employeeList-channel",
    tag: commonTags.inventory,
    events: ["list-updated", "list-cleared"],
  },
  {
    channel: "orders-channel",
    tag: commonTags.inventory,
    events: ["order-created", "order-updated", "order-cancelled"],
  },
  {
    channel: "rawmaterials-channel",
    tag: commonTags.inventory,
    events: ["rawmaterial-created", "rawmaterial-updated", "rawmaterial-deleted"],
  },
  {
    channel: "rawmaterialsregister-channel",
    tag: commonTags.inventory,
    events: ["intake-logged", "intake-updated", "intake-removed"],
  },
  {
    channel: "expense-channel",
    tag: commonTags.inventory,
    events: ["expense-created", "expense-updated", "expense-deleted"],
  },
  {
    channel: "entries-channel",
    tag: commonTags.inventory,
    events: [
      "stock-added",
      "stock-created",
      "item-updated",
      "sale-created",
      "sale-deleted",
      "item-deleted",
    ],
  },
];

const ProtectedLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useSelector(selectRoles) ?? EMPTY_ARRAY;
  const profile = useSelector(selectProfile) ?? {};
  const notifications = useSelector(selectNotifications) ?? EMPTY_ARRAY;
  const { settings, notificationPollingInterval } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navHiddenOnScroll, setNavHiddenOnScroll] = useState(false);
  const contentScrollRef = useRef(null);
  const [signOut] = useSendLogoutMutation();
  const isDark = settings?.theme === "dark";

  useGetNotificationsQuery(undefined, { pollingInterval: notificationPollingInterval });

  useEffect(() => {
    subscriptions.forEach((subscription) => {
      dispatch({ type: PUSHER_SUBSCRIBE, payload: subscription });
    });
  }, [dispatch]);

  useEffect(() => {
    const scrollElement = contentScrollRef.current;
    if (!scrollElement) return undefined;

    let lastScrollTop = scrollElement.scrollTop;
    let ticking = false;

    const updateNavbarVisibility = () => {
      const nextScrollTop = Math.max(scrollElement.scrollTop, 0);
      const delta = nextScrollTop - lastScrollTop;

      if (nextScrollTop < 24) {
        setNavHiddenOnScroll(false);
      } else if (Math.abs(delta) > 8) {
        setNavHiddenOnScroll(delta > 0);
      }

      lastScrollTop = nextScrollTop;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbarVisibility);
        ticking = true;
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item?.is_read).length,
    [notifications]
  );

  const handleLogout = async () => {
    try {
      await signOut().unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logOut());
      dispatch({ type: PUSHER_DISCONNECT });
      navigate("/");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        minHeight: 0,
        display: "flex",
        overflow: "hidden",
        bgcolor: "var(--ampla-app-bg, #f8fbf8)",
        color: "var(--ampla-text-color, #15202b)",
      }}
    >
      <ModernSidebar
        roles={roles}
        profile={profile}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ModernNavBar
          profile={{
            ...profile,
            userRole: roles?.[0] || "Workspace",
          }}
          notifications={unreadNotifications}
          onLogout={handleLogout}
          onMenuToggle={() => setMobileOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((value) => !value)}
          hiddenOnCompactScroll={navHiddenOnScroll}
        />

        <Box
          ref={contentScrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 1.5, sm: 2, md: 2.5 },
            pb: {
              xs: "calc(6.5rem + env(safe-area-inset-bottom))",
              lg: 2.5,
            },
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarGutter: "stable",
            scrollbarWidth: "thin",
            bgcolor: "var(--ampla-app-bg, #f8fbf8)",
            color: "var(--ampla-text-color, #15202b)",
            scrollbarColor: isDark
              ? "var(--ampla-accent-color, #3f5d49) var(--ampla-surface-soft, #18231e)"
              : "var(--ampla-accent-color, #c3d4c8) var(--ampla-surface-soft, #eef5f0)",
            "&::-webkit-scrollbar": {
              width: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "var(--ampla-surface-soft, #eef5f0)",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--ampla-accent-color, #c3d4c8)",
              borderRadius: 999,
              border: "2px solid var(--ampla-surface-soft, #eef5f0)",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "var(--ampla-accent-color, #9bb8a3)",
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <MobileBottomNav roles={roles} />
      <FloatingHelpBubble roles={roles} />
    </Box>
  );
};

export default ProtectedLayout;
