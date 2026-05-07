import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  OverlayTrigger,
  Row,
  Stack,
  Tooltip,
} from "react-bootstrap";
import {
  ArrowClockwise,
  Bell,
  Boxes,
  CashCoin,
  CheckCircleFill,
  GearWideConnected,
  MoonStars,
  Palette,
} from "react-bootstrap-icons";
import { BsExclamationCircleFill } from "react-icons/bs";
import { useSelector } from "react-redux";

import {
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
} from "../auth/authApiSlice";
import { selectProfile, selectRoles } from "../auth/authSlice";
import AdminAccountManager from "./production/AdminAccountManager";
import "./pages/WorkspacePages.css";

const DEVELOPER_LOGO_SRC = `${process.env.PUBLIC_URL || ""}/logos/hamuzahAndSteve.png`;

export const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

export const defaultSettings = {
  minWholesaleOrder: 500,
  currency: "UGX",
  autoPriceDetermination: false,
  lowLevelProducts: 10,
  lowLevelMaterials: 50,
  notificationFrequency: "Weekly",
  theme: "light",
  navbarColor: "#2f8f57",
  sidebarColor: "#f4faf6",
  taxRate: 0,
  allowDebtSales: true,
};

const palette = {
  surface: "var(--ampla-surface-bg, #ffffff)",
  border: "var(--ampla-border-color, #e7efe9)",
  text: "var(--ampla-text-color, #15202b)",
  muted: "var(--ampla-muted-color, #6f7d8c)",
  green: "var(--ampla-accent-color, #2f8f57)",
  greenSoft: "var(--ampla-accent-soft, #e8f5ec)",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  red: "#ef4444",
  redSoft: "#ffebeb",
  shadow: "var(--ampla-shadow, 0 12px 32px rgba(15, 23, 42, 0.05))",
};

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: palette.surface,
  boxShadow: palette.shadow,
  border: `1px solid ${palette.border}`,
};

const controlStyle = {
  minHeight: 46,
  borderRadius: 16,
  borderColor: palette.border,
  boxShadow: "none",
};

const actionButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.15rem",
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  backgroundColor: "var(--ampla-surface-bg, #ffffff)",
  color: palette.text,
  fontWeight: 700,
};

const numericSettingKeys = new Set([
  "minWholesaleOrder",
  "lowLevelProducts",
  "lowLevelMaterials",
  "taxRate",
]);

const notificationIntervals = {
  Daily: 24 * 60 * 60 * 1000,
  Weekly: 7 * 24 * 60 * 60 * 1000,
  Monthly: 30 * 24 * 60 * 60 * 1000,
  Never: 0,
};

const clampNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric < 0 ? 0 : numeric;
};

const mergeSettings = (candidate) => {
  const source =
    candidate && typeof candidate === "object" && !Array.isArray(candidate)
      ? candidate
      : {};

  return {
    ...defaultSettings,
    ...source,
    minWholesaleOrder: clampNumber(
      source.minWholesaleOrder,
      defaultSettings.minWholesaleOrder
    ),
    lowLevelProducts: clampNumber(
      source.lowLevelProducts,
      defaultSettings.lowLevelProducts
    ),
    lowLevelMaterials: clampNumber(
      source.lowLevelMaterials,
      defaultSettings.lowLevelMaterials
    ),
    taxRate: clampNumber(source.taxRate, defaultSettings.taxRate),
    allowDebtSales:
      typeof source.allowDebtSales === "boolean"
        ? source.allowDebtSales
        : source.allowDebtSales === undefined
          ? defaultSettings.allowDebtSales
          : ["1", "true", "yes", "enabled"].includes(String(source.allowDebtSales).toLowerCase()),
    autoPriceDetermination: Boolean(source.autoPriceDetermination),
    theme: source.theme === "dark" ? "dark" : "light",
    currency:
      typeof source.currency === "string" && source.currency.trim()
        ? source.currency
        : defaultSettings.currency,
    notificationFrequency:
      source.notificationFrequency in notificationIntervals
        ? source.notificationFrequency
        : defaultSettings.notificationFrequency,
    navbarColor:
      typeof source.navbarColor === "string" && source.navbarColor.trim()
        ? source.navbarColor
        : defaultSettings.navbarColor,
    sidebarColor:
      typeof source.sidebarColor === "string" && source.sidebarColor.trim()
        ? source.sidebarColor
        : defaultSettings.sidebarColor,
  };
};

const loadStoredSettings = () => {
  try {
    const savedSettings = localStorage.getItem("appSettings");
    return savedSettings ? mergeSettings(JSON.parse(savedSettings)) : defaultSettings;
  } catch (error) {
    console.error("Failed to load settings from storage", error);
    return defaultSettings;
  }
};

const parseSettingsCandidate = (candidate) => {
  if (!candidate) return null;
  if (typeof candidate === "string") {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      console.error("Failed to parse server settings", error);
      return null;
    }
  }
  return typeof candidate === "object" && !Array.isArray(candidate) ? candidate : null;
};

const hexToRgb = (hex) => {
  const normalized = typeof hex === "string" ? hex.replace("#", "") : "";
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return { r: 47, g: 143, b: 87 };
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const applyAppearanceSettings = (settings) => {
  const accentRgb = hexToRgb(settings.navbarColor);
  const surface = settings.theme === "dark" ? "#111917" : "#ffffff";
  const surfaceSoft = settings.theme === "dark" ? "#16211e" : "#fbfdfb";
  const appBg = settings.theme === "dark" ? "#0c1210" : "#f8fbf8";
  const text = settings.theme === "dark" ? "#edf3ef" : "#15202b";
  const muted = settings.theme === "dark" ? "#9fb0a7" : "#6f7d8c";
  const border = settings.theme === "dark" ? "rgba(255,255,255,0.12)" : "#e7efe9";

  document.documentElement.setAttribute("data-bs-theme", settings.theme);
  document.documentElement.style.setProperty("--ampla-navbar-color", settings.navbarColor);
  document.documentElement.style.setProperty("--ampla-sidebar-color", settings.sidebarColor);
  document.documentElement.style.setProperty("--ampla-accent-color", settings.navbarColor);
  document.documentElement.style.setProperty("--ampla-accent-rgb", `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
  document.documentElement.style.setProperty("--ampla-accent-soft", `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${settings.theme === "dark" ? 0.18 : 0.12})`);
  document.documentElement.style.setProperty("--ampla-app-bg", appBg);
  document.documentElement.style.setProperty("--ampla-surface-bg", surface);
  document.documentElement.style.setProperty("--ampla-surface-soft", surfaceSoft);
  document.documentElement.style.setProperty("--ampla-text-color", text);
  document.documentElement.style.setProperty("--ampla-muted-color", muted);
  document.documentElement.style.setProperty("--ampla-border-color", border);
  document.documentElement.style.setProperty("--ampla-input-bg", settings.theme === "dark" ? "#101715" : "#ffffff");
  document.documentElement.style.setProperty("--ampla-shadow", settings.theme === "dark" ? "0 16px 36px rgba(0, 0, 0, 0.24)" : "0 12px 32px rgba(15, 23, 42, 0.05)");
  document.documentElement.style.setProperty("--bs-body-bg", appBg);
  document.documentElement.style.setProperty("--bs-body-color", text);
  document.documentElement.style.setProperty("--bs-border-color", border);
  document.documentElement.style.setProperty("--bs-tertiary-bg", surfaceSoft);
  document.documentElement.style.setProperty("--bs-primary", settings.navbarColor);
  document.documentElement.style.setProperty("--bs-success", settings.navbarColor);
  document.body.classList.toggle("ampla-dark-theme", settings.theme === "dark");
  document.body.classList.toggle("ampla-light-theme", settings.theme !== "dark");
  document.body.style.backgroundColor = appBg;
  document.body.style.color = text;
  document.body.style.transition =
    "background-color 0.2s ease, color 0.2s ease";
};

export const SettingsProvider = ({ children }) => {
  const profile = useSelector(selectProfile);
  const [settings, setSettings] = useState(loadStoredSettings);

  useEffect(() => {
    if (profile && profile.appSettingsConfigured === false) return;

    const serverSettings = parseSettingsCandidate(profile?.appSettings);
    if (!serverSettings) return;

    const mergedSettings = mergeSettings(serverSettings);
    setSettings((previous) =>
      JSON.stringify(previous) === JSON.stringify(mergedSettings)
        ? previous
        : mergedSettings
    );
  }, [profile?.appSettings, profile?.appSettingsConfigured]);

  useEffect(() => {
    try {
      localStorage.setItem("appSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to persist settings", error);
    }
    applyAppearanceSettings(settings);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((previous) => {
      if (numericSettingKeys.has(key)) {
        return { ...previous, [key]: clampNumber(value, previous[key]) };
      }
      return { ...previous, [key]: value };
    });
  };

  const handleThemeChange = () => {
    updateSetting("theme", settings.theme === "light" ? "dark" : "light");
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const replaceSettings = (nextSettings) => {
    setSettings(mergeSettings(nextSettings));
  };

  const value = {
    settings,
    updateSetting,
    handleThemeChange,
    resetSettings,
    replaceSettings,
    notificationPollingInterval:
      notificationIntervals[settings.notificationFrequency] ?? notificationIntervals.Weekly,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

const SettingsPersistenceIndicator = () => (
  <OverlayTrigger
    trigger="click"
    placement="top"
    rootClose
    overlay={
      <Tooltip id="local-storage-tooltip">
        This setting applies immediately and admins can save it for the whole workspace.
      </Tooltip>
    }
  >
    <span className="ms-2 text-success" style={{ cursor: "pointer" }}>
      <BsExclamationCircleFill />
    </span>
  </OverlayTrigger>
);

const MetricCard = ({ icon, title, value, note, accent, color }) => (
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

const SettingField = ({ label, helpText, children }) => (
  <div className="mb-3">
    <div className="d-flex align-items-center mb-2">
      <Form.Label className="mb-0 fw-bold" style={{ color: palette.text }}>
        {label}
      </Form.Label>
      <SettingsPersistenceIndicator />
    </div>
    {children}
    {helpText ? (
      <div className="mt-2 small" style={{ color: palette.muted, lineHeight: 1.6 }}>
        {helpText}
      </div>
    ) : null}
  </div>
);

const BusinessProfileSection = ({ profile, setProfile, onSave, isSaving }) => {
  const handleFieldChange = (key, value) =>
    setProfile((previous) => ({ ...previous, [key]: value }));

  return (
    <Card style={sectionCardStyle}>
      <Card.Body className="p-4">
        <div className="workspace-section-head mb-3">
          <div>
            <h3 className="workspace-section-title">Business Profile</h3>
            <p className="workspace-section-copy">
              Keep the public business identity and contact details up to date.
            </p>
          </div>
          <Button
            variant="success"
            onClick={onSave}
            disabled={isSaving}
            style={{
              minHeight: 44,
              borderRadius: 14,
              fontWeight: 700,
              backgroundColor: palette.green,
              borderColor: palette.green,
              flexShrink: 0,
            }}
          >
            {isSaving ? "Saving Profile..." : "Save Business Profile"}
          </Button>
        </div>
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>Business Name</Form.Label>
            <Form.Control
              style={controlStyle}
              type="text"
              value={profile.busName || ""}
              onChange={(event) => handleFieldChange("busName", event.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>Business Owner</Form.Label>
            <Form.Control
              style={controlStyle}
              type="text"
              value={profile.busOwner || ""}
              onChange={(event) => handleFieldChange("busOwner", event.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>Location</Form.Label>
            <Form.Control
              style={controlStyle}
              type="text"
              value={profile.busLocation || ""}
              onChange={(event) => handleFieldChange("busLocation", event.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>Building / Plaza</Form.Label>
            <Form.Control
              style={controlStyle}
              type="text"
              value={profile.busBuilding || ""}
              onChange={(event) => handleFieldChange("busBuilding", event.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>Primary Contact</Form.Label>
            <Form.Control
              style={controlStyle}
              type="tel"
              value={profile.busContactOne || ""}
              onChange={(event) =>
                handleFieldChange("busContactOne", event.target.value)
              }
            />
          </Col>
          <Col md={6}>
            <Form.Label>Secondary Contact</Form.Label>
            <Form.Control
              style={controlStyle}
              type="tel"
              value={profile.busContactTwo || ""}
              onChange={(event) =>
                handleFieldChange("busContactTwo", event.target.value)
              }
            />
          </Col>
          <Col md={6}>
            <Form.Label>Business Email</Form.Label>
            <Form.Control
              style={controlStyle}
              type="email"
              value={profile.busEmail || ""}
              onChange={(event) => handleFieldChange("busEmail", event.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>Business Logo</Form.Label>
            <Form.Control style={controlStyle} type="file" disabled />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const Settings = () => {
  const roles = useSelector(selectRoles) ?? [];
  const reduxProfile = useSelector(selectProfile);
  const isAllowed = roles.includes("admin");

  const {
    settings,
    updateSetting,
    handleThemeChange,
    replaceSettings,
  } = useSettings();
  const [profileUpdate, { isLoading }] = useUpdateProfileMutation();
  const [settingsUpdate, { isLoading: isSavingSettings }] =
    useUpdateSettingsMutation();
  const [businessProfile, setBusinessProfile] = useState(reduxProfile);
  const [saveState, setSaveState] = useState({
    variant: "",
    message: "",
  });

  useEffect(() => {
    setBusinessProfile(reduxProfile || {});
  }, [reduxProfile]);

  const metrics = useMemo(
    () => [
      {
        icon: <CashCoin size={18} />,
        title: "Currency",
        value: settings.currency === "none" ? "Hidden" : settings.currency,
        note: "Used across workspace totals and reports",
        accent: palette.greenSoft,
        color: palette.green,
      },
      {
        icon: <Boxes size={18} />,
        title: "Product Threshold",
        value: settings.lowLevelProducts,
        note: "Items at or below this level are treated as low stock",
        accent: palette.blueSoft,
        color: palette.blue,
      },
      {
        icon: <Bell size={18} />,
        title: "Notification Cycle",
        value: settings.notificationFrequency,
        note: "Controls how often the app refreshes alerts",
        accent: palette.amberSoft,
        color: palette.amber,
      },
      {
        icon: <MoonStars size={18} />,
        title: "Theme",
        value: settings.theme === "dark" ? "Dark" : "Light",
        note: settings.autoPriceDetermination
          ? "Auto pricing is enabled in the workspace"
          : "Manual pricing remains available in sales",
        accent: palette.redSoft,
        color: palette.red,
      },
    ],
    [settings]
  );

  const handleNumberSetting = (key, value) => {
    updateSetting(key, value === "" ? 0 : value);
  };

  const handleSaveProfile = async () => {
    try {
      await profileUpdate({ businessProfile }).unwrap();
      setSaveState({
        variant: "success",
        message: "Business profile saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile", error);
      setSaveState({
        variant: "danger",
        message: "Business profile could not be saved. Please try again.",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await settingsUpdate({ settings }).unwrap();
      const savedSettings =
        response?.data?.settings ?? response?.settings ?? settings;
      replaceSettings(savedSettings);
      setSaveState({
        variant: "success",
        message: "Workspace preferences saved for all users.",
      });
    } catch (error) {
      console.error("Failed to update settings", error);
      setSaveState({
        variant: "danger",
        message: "Workspace preferences could not be saved. Please try again.",
      });
    }
  };

  const handleResetPreferences = async () => {
    replaceSettings(defaultSettings);

    if (!isAllowed) {
      setSaveState({
        variant: "info",
        message: "Preferences have been reset on this device.",
      });
      return;
    }

    try {
      const response = await settingsUpdate({ settings: defaultSettings }).unwrap();
      const savedSettings =
        response?.data?.settings ?? response?.settings ?? defaultSettings;
      replaceSettings(savedSettings);
      setSaveState({
        variant: "success",
        message: "Workspace preferences reset to defaults for all users.",
      });
    } catch (error) {
      console.error("Failed to reset settings", error);
      setSaveState({
        variant: "warning",
        message: "Preferences reset on this device, but could not be saved globally.",
      });
    }
  };

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Settings Workspace</h2>
            <p className="workspace-page-subtitle">
              Configure pricing thresholds, inventory alerts, theme colors, and the
              business profile from one clean control room.
            </p>
          </div>
          <div className="workspace-page-actions">
            {isAllowed ? (
              <Button
                variant="success"
                style={{
                  ...actionButtonStyle,
                  backgroundColor: palette.green,
                  borderColor: palette.green,
                  color: "#ffffff",
                }}
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                <GearWideConnected className="me-2" />
                {isSavingSettings ? "Saving..." : "Save Preferences"}
              </Button>
            ) : null}
            <Button
              variant="light"
              style={actionButtonStyle}
              onClick={handleResetPreferences}
              disabled={isSavingSettings}
            >
              <ArrowClockwise className="me-2" />
              Reset To Defaults
            </Button>
          </div>
        </header>

        <div className="workspace-metric-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        {saveState.message ? (
          <Alert variant={saveState.variant} className="mb-0" style={{ borderRadius: 20 }}>
            {saveState.message}
          </Alert>
        ) : null}

        {isAllowed ? (
          <BusinessProfileSection
            profile={businessProfile}
            setProfile={setBusinessProfile}
            onSave={handleSaveProfile}
            isSaving={isLoading}
          />
        ) : null}

        <Row className="g-4">
          <Col xl={8}>
            <Stack gap={4}>
              {isAllowed ? (
                <Card style={sectionCardStyle}>
                  <Card.Body className="p-4">
                    <div className="workspace-section-head mb-3">
                      <div>
                        <h3 className="workspace-section-title">
                          Pricing And Sales Behavior
                        </h3>
                        <p className="workspace-section-copy">
                          Control the selling currency, wholesale threshold, and whether
                          the sales desk can react automatically.
                        </p>
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <SettingField
                          label="Minimum Wholesale Order"
                          helpText="Used by the sales desk as the order threshold for wholesale behavior."
                        >
                          <Form.Control
                            style={controlStyle}
                            type="number"
                            min="0"
                            value={settings.minWholesaleOrder}
                            onChange={(event) =>
                              handleNumberSetting(
                                "minWholesaleOrder",
                                event.target.value
                              )
                            }
                          />
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Currency"
                          helpText="Shown in reports, inventory, customers, POS, and receipt views."
                        >
                          <Form.Select
                            style={controlStyle}
                            value={settings.currency}
                            onChange={(event) =>
                              updateSetting("currency", event.target.value)
                            }
                          >
                            <option value="none">Hide currency label</option>
                            <option value="UGX">UGX</option>
                            <option value="USD">USD</option>
                            <option value="KES">KES</option>
                            <option value="TZS">TZS</option>
                          </Form.Select>
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Automatic Price Determination"
                          helpText="Lets the sales desk move to wholesale pricing automatically once the threshold is met."
                        >
                          <Form.Check
                            type="switch"
                            checked={settings.autoPriceDetermination}
                            onChange={(event) =>
                              updateSetting(
                                "autoPriceDetermination",
                                event.target.checked
                              )
                            }
                            label="Enable automatic wholesale pricing"
                          />
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Default Tax Rate"
                          helpText="Used as the starting tax percentage in the sales desk."
                        >
                          <Form.Control
                            style={controlStyle}
                            type="number"
                            min="0"
                            value={settings.taxRate}
                            onChange={(event) =>
                              handleNumberSetting("taxRate", event.target.value)
                            }
                          />
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Debt Sales"
                          helpText="Global POS policy. Branches can inherit this value or override it from Branches Management."
                        >
                          <Form.Check
                            type="switch"
                            checked={settings.allowDebtSales}
                            onChange={(event) =>
                              updateSetting("allowDebtSales", event.target.checked)
                            }
                            label="Allow POS sales with an outstanding customer balance"
                          />
                        </SettingField>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ) : null}

              {isAllowed ? (
                <Card style={sectionCardStyle}>
                  <Card.Body className="p-4">
                    <div className="workspace-section-head mb-3">
                      <div>
                        <h3 className="workspace-section-title">
                          Inventory And Alert Thresholds
                        </h3>
                        <p className="workspace-section-copy">
                          These values now drive low-stock indicators across dashboard,
                          inventory, reports, and sales views.
                        </p>
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <SettingField
                          label="Low Stock Threshold For Products"
                          helpText="Items at or below this quantity are marked low stock."
                        >
                          <Form.Control
                            style={controlStyle}
                            type="number"
                            min="0"
                            value={settings.lowLevelProducts}
                            onChange={(event) =>
                              handleNumberSetting(
                                "lowLevelProducts",
                                event.target.value
                              )
                            }
                          />
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Low Stock Threshold For Raw Materials"
                          helpText="Used by raw material reporting and stock health logic."
                        >
                          <Form.Control
                            style={controlStyle}
                            type="number"
                            min="0"
                            value={settings.lowLevelMaterials}
                            onChange={(event) =>
                              handleNumberSetting(
                                "lowLevelMaterials",
                                event.target.value
                              )
                            }
                          />
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Notification Frequency"
                          helpText="Affects how often the application refreshes the notification feed."
                        >
                          <Form.Select
                            style={controlStyle}
                            value={settings.notificationFrequency}
                            onChange={(event) =>
                              updateSetting(
                                "notificationFrequency",
                                event.target.value
                              )
                            }
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Never">Never</option>
                          </Form.Select>
                        </SettingField>
                      </Col>
                      <Col md={6}>
                        <SettingField
                          label="Current Alert Summary"
                          helpText="A quick reminder of the active thresholds now used in the app."
                        >
                          <div
                            className="d-flex flex-wrap gap-2 p-3"
                            style={{
                              minHeight: 46,
                              borderRadius: 16,
                              border: `1px solid ${palette.border}`,
                              backgroundColor: "var(--ampla-surface-soft, #fbfdfb)",
                            }}
                          >
                            <span className="badge text-bg-light">
                              Products: {settings.lowLevelProducts}
                            </span>
                            <span className="badge text-bg-light">
                              Materials: {settings.lowLevelMaterials}
                            </span>
                            <span className="badge text-bg-light">
                              Notifications: {settings.notificationFrequency}
                            </span>
                          </div>
                        </SettingField>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ) : null}

              <Card style={sectionCardStyle}>
                <Card.Body className="p-4">
                  <div className="workspace-section-head mb-3">
                    <div>
                      <h3 className="workspace-section-title">Appearance</h3>
                      <p className="workspace-section-copy">
                        Theme, navbar, sidebar, forms, cards, modals, and shared
                        workspace surfaces update live across the app.
                      </p>
                    </div>
                    <div className="workspace-page-actions">
                      <Button
                        variant="outline-secondary"
                        style={actionButtonStyle}
                        onClick={handleResetPreferences}
                        disabled={isSavingSettings}
                      >
                        <ArrowClockwise className="me-2" />
                        Reset Defaults
                      </Button>
                      {isAllowed ? (
                        <Button
                          variant="success"
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: palette.green,
                            borderColor: palette.green,
                            color: "#ffffff",
                          }}
                          onClick={handleSaveSettings}
                          disabled={isSavingSettings}
                        >
                          <GearWideConnected className="me-2" />
                          {isSavingSettings ? "Saving..." : "Save Appearance"}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <SettingField
                        label="Theme"
                        helpText="Switches the app shell between light and dark styling."
                      >
                        <Form.Check
                          type="switch"
                          checked={settings.theme === "dark"}
                          onChange={handleThemeChange}
                          label={
                            settings.theme === "dark"
                              ? "Dark mode enabled"
                              : "Light mode enabled"
                          }
                        />
                      </SettingField>
                    </Col>
                    <Col md={6}>
                      <SettingField
                        label="Navbar Accent"
                        helpText="Used by the modern top bar and shell accents."
                      >
                        <Form.Control
                          style={controlStyle}
                          type="color"
                          value={settings.navbarColor}
                          onChange={(event) =>
                            updateSetting("navbarColor", event.target.value)
                          }
                        />
                      </SettingField>
                    </Col>
                    <Col md={6}>
                      <SettingField
                        label="Sidebar Background"
                        helpText="Applied to the desktop and mobile navigation workspace."
                      >
                        <Form.Control
                          style={controlStyle}
                          type="color"
                          value={settings.sidebarColor}
                          onChange={(event) =>
                            updateSetting("sidebarColor", event.target.value)
                          }
                        />
                      </SettingField>
                    </Col>
                    <Col md={6}>
                      <SettingField
                        label="Theme Preview"
                        helpText="A quick live preview of the current shell palette."
                      >
                        <div
                          className="p-3"
                          style={{
                            borderRadius: 20,
                            border: `1px solid ${palette.border}`,
                            background:
                              settings.theme === "dark"
                                ? "var(--ampla-input-bg, #101715)"
                                : "linear-gradient(135deg, var(--ampla-surface-soft, #f7fbf8), var(--ampla-surface-bg, #ffffff))",
                          }}
                        >
                          <div
                            className="mb-3"
                            style={{
                              height: 14,
                              borderRadius: 999,
                              backgroundColor: settings.navbarColor,
                            }}
                          />
                          <div className="d-flex gap-3">
                            <div
                              style={{
                                width: 72,
                                minHeight: 88,
                                borderRadius: 18,
                                backgroundColor: settings.sidebarColor,
                                border: `1px solid ${palette.border}`,
                              }}
                            />
                            <div className="flex-grow-1">
                              <div
                                className="mb-2"
                                style={{
                                  height: 18,
                                  width: "72%",
                                  borderRadius: 999,
                                  backgroundColor:
                                    settings.theme === "dark"
                                      ? "rgba(255,255,255,0.16)"
                                      : "#e8f5ec",
                                }}
                              />
                              <div
                                style={{
                                  height: 14,
                                  width: "48%",
                                  borderRadius: 999,
                                  backgroundColor:
                                    settings.theme === "dark"
                                      ? "rgba(255,255,255,0.08)"
                                      : "#edf3ee",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </SettingField>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Stack>
          </Col>

          <Col xl={4}>
            <Stack gap={4}>
              <Card style={sectionCardStyle}>
                <Card.Body className="p-4">
                  <div className="workspace-section-head mb-3">
                    <div>
                      <h3 className="workspace-section-title">Live Application Status</h3>
                      <p className="workspace-section-copy">
                        These are the settings already influencing the current app.
                      </p>
                    </div>
                  </div>

                  <Stack gap={3}>
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="workspace-metric-icon"
                        style={{
                          width: 46,
                          height: 46,
                          backgroundColor: palette.greenSoft,
                          color: palette.green,
                        }}
                      >
                        <Palette size={18} />
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: palette.text }}>
                          Shell colors are active
                        </div>
                        <div style={{ color: palette.muted, lineHeight: 1.6 }}>
                          The modern navbar, sidebar, and protected layout now respond to
                          your appearance settings.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="workspace-metric-icon"
                        style={{
                          width: 46,
                          height: 46,
                          backgroundColor: palette.blueSoft,
                          color: palette.blue,
                        }}
                      >
                        <GearWideConnected size={18} />
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: palette.text }}>
                          Thresholds are active
                        </div>
                        <div style={{ color: palette.muted, lineHeight: 1.6 }}>
                          Dashboard, inventory, reports, and POS low-stock counters now
                          use these saved levels.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="workspace-metric-icon"
                        style={{
                          width: 46,
                          height: 46,
                          backgroundColor: palette.amberSoft,
                          color: palette.amber,
                        }}
                      >
                        <CashCoin size={18} />
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: palette.text }}>
                          Pricing defaults are active
                        </div>
                        <div style={{ color: palette.muted, lineHeight: 1.6 }}>
                          Currency, tax defaults, and wholesale pricing rules now feed the
                          sales desk and reporting views.
                        </div>
                      </div>
                    </div>
                  </Stack>
                </Card.Body>
              </Card>

              <Card style={sectionCardStyle}>
                <Card.Body className="p-4">
                  <div className="workspace-section-head mb-3">
                    <div>
                      <h3 className="workspace-section-title">Workspace Notes</h3>
                    </div>
                  </div>

                  <Stack gap={3}>
                    <Alert variant="info" className="mb-0" style={{ borderRadius: 20 }}>
                      Preferences apply immediately on this device. Admins can use Save
                      Preferences to publish them to the whole workspace.
                    </Alert>
                    {!isAllowed ? (
                      <div
                        className="p-3 rounded-4"
                        style={{
                          backgroundColor: "var(--ampla-surface-soft, #fbfdfb)",
                          border: `1px solid ${palette.border}`,
                          color: palette.muted,
                          lineHeight: 1.7,
                        }}
                      >
                        You can view appearance preferences here, but only admins can save
                        operational and business profile changes.
                      </div>
                    ) : null}
                  </Stack>
                </Card.Body>
              </Card>

              <Card style={sectionCardStyle}>
                <Card.Body className="p-4">
                  <div className="workspace-section-head mb-3">
                    <div>
                      <h3 className="workspace-section-title">Current Preferences</h3>
                    </div>
                  </div>

                  <Stack gap={2}>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Theme</span>
                      <strong style={{ color: palette.text }}>{settings.theme}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Currency</span>
                      <strong style={{ color: palette.text }}>{settings.currency}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Product Threshold</span>
                      <strong style={{ color: palette.text }}>
                        {settings.lowLevelProducts}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Material Threshold</span>
                      <strong style={{ color: palette.text }}>
                        {settings.lowLevelMaterials}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Auto Pricing</span>
                      <strong style={{ color: palette.text }}>
                        {settings.autoPriceDetermination ? "Enabled" : "Disabled"}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: palette.muted }}>Notification Refresh</span>
                      <strong style={{ color: palette.text }}>
                        {settings.notificationFrequency}
                      </strong>
                    </div>
                  </Stack>
                </Card.Body>
              </Card>
            </Stack>
          </Col>
        </Row>

        {isAllowed ? (
          <section>
            <AdminAccountManager />
          </section>
        ) : null}

        <section
          className="d-flex align-items-center justify-content-center gap-3 flex-wrap px-3 py-3"
          style={{
            borderTop: `1px solid ${palette.border}`,
            borderBottom: `1px solid ${palette.border}`,
            color: palette.muted,
          }}
        >
          <img
            src={DEVELOPER_LOGO_SRC}
            alt="HamuzahAndSteve Technology"
            width={58}
            height={58}
            style={{ objectFit: "contain" }}
          />
          <div style={{ maxWidth: 620 }}>
            <div className="fw-bold" style={{ color: palette.text }}>
              Developed by HamuzahAndSteve Technology
            </div>
            <div className="small" style={{ lineHeight: 1.6 }}>
              Ampla Uganda is built and maintained with care for practical business
              teams that need clear inventory, production, sales, and reporting tools.
            </div>
          </div>
        </section>

        <footer className="pt-3 text-center small" style={{ color: palette.muted }}>
          <div>
            <CheckCircleFill className="me-2 text-success" />
            Workspace preferences are cached locally, synced from the business profile, and applied without needing a refresh.
          </div>
        </footer>
      </div>
    </Container>
  );
};

export default Settings;
