import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Activity,
  ArrowClockwise,
  Camera,
  CheckCircle,
  Eye,
  Key,
  PencilSquare,
  PersonCheck,
  PersonDash,
  Search,
  ShieldLock,
  SlashCircle,
  Trash,
  X,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import {
  useDeleteUserMutation,
  useGetAccountsQuery,
  useGetStaffActivityQuery,
  useGetStaffOverviewQuery,
  useUpdateStaffStatusMutation,
  useUploadStaffDocumentsMutation,
} from "../../features/api/AccountsSlice";
import AdminAccountManager from "../production/AdminAccountManager";

const EMPTY_ARRAY = [];
const PROTECTED_ACCOUNT_ROLES = new Set(["admin", "superadmin", "super_admin", "super admin", "developer"]);

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const isProtectedAccount = (user) =>
  (user?.roles ?? EMPTY_ARRAY).some((role) => PROTECTED_ACCOUNT_ROLES.has(normalizeRole(role)));

const API_PUBLIC_BASE = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/api\/?$/, "");

const toAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_PUBLIC_BASE.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
};

const statusConfig = {
  active: { label: "Active", color: "#2f8f57", background: "#e7f6ed" },
  inactive: { label: "Inactive", color: "#6b7280", background: "#f1f5f9" },
  banned: { label: "Banned", color: "#b42318", background: "#fee4e2" },
  password_reset_required: {
    label: "Reset required",
    color: "#b54708",
    background: "#fff4db",
  },
};

const normalizeDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "object") {
    const nestedValue = value.date || value.datetime || value.time || value.value;
    if (!nestedValue) return null;

    return normalizeDateValue(nestedValue);
  }

  const rawValue = String(value);
  return new Date(rawValue.replace(" ", "T"));
};

const formatDateTime = (value) => {
  const date = normalizeDateValue(value);
  if (!date) return "Never";

  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "Never";

  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initials = (name = "U") =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

const staffSurfaceSx = {
  border: "1px solid var(--ampla-border-color, #e6ece8)",
  bgcolor: "var(--ampla-surface-bg, #ffffff)",
  color: "var(--ampla-text-color, #17251d)",
};

const StatCard = ({ label, value, tone = "#2f8f57", icon: Icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: "100%",
      borderRadius: 2,
      ...staffSurfaceSx,
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: tone,
          bgcolor: alpha(tone, 0.1),
          flexShrink: 0,
        }}
      >
        <Icon size={19} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--ampla-text-color, #17251d)" }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--ampla-muted-color, #647067)" }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const StaffManagementPage = () => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [reason, setReason] = useState("");
  const [documentUser, setDocumentUser] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const { data, isLoading, isFetching, refetch, error } = useGetStaffOverviewQuery();
  useGetAccountsQuery(undefined, { skip: tab !== 1 });
  const [updateStaffStatus, { isLoading: isActionLoading }] = useUpdateStaffStatusMutation();
  const [deleteUser, { isLoading: isDeleteLoading }] = useDeleteUserMutation();
  const [uploadStaffDocuments, { isLoading: isUploadingDocuments }] = useUploadStaffDocumentsMutation();

  const users = data?.users ?? EMPTY_ARRAY;
  const staffUsers = useMemo(
    () => users.filter((user) => !isProtectedAccount(user)),
    [users]
  );
  const visibleSummary = useMemo(
    () => ({
      total: staffUsers.length,
      online: staffUsers.filter((user) => user.online).length,
      active: staffUsers.filter((user) => user.accountStatus === "active").length,
      inactive: staffUsers.filter((user) => user.accountStatus === "inactive").length,
      banned: staffUsers.filter((user) => user.accountStatus === "banned").length,
      passwordResetRequired: staffUsers.filter((user) => user.forcePasswordReset).length,
    }),
    [staffUsers]
  );
  const roles = useMemo(
    () => Array.from(new Set(staffUsers.flatMap((user) => user.roles ?? EMPTY_ARRAY))).sort(),
    [staffUsers]
  );
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staffUsers.filter((user) => {
      const matchesSearch =
        !query ||
        [user.username, user.email, ...(user.roles ?? EMPTY_ARRAY)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "all" || user.accountStatus === statusFilter;
      const matchesRole = roleFilter === "all" || (user.roles ?? EMPTY_ARRAY).includes(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [roleFilter, search, staffUsers, statusFilter]);

  const selectedUserId = selectedUser?.id;
  const { data: activityData, isFetching: isActivityFetching } = useGetStaffActivityQuery(
    selectedUserId,
    { skip: !selectedUserId }
  );

  const openConfirm = (user, action) => {
    setConfirmAction({ user, action });
    setReason("");
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setReason("");
  };

  const openDocumentDialog = (user) => {
    setDocumentUser(user);
    setPassportFile(null);
    setIdFile(null);
  };

  const closeDocumentDialog = () => {
    setDocumentUser(null);
    setPassportFile(null);
    setIdFile(null);
    setCameraTarget(null);
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!cameraTarget) {
      stopCamera();
      return undefined;
    }

    let active = true;
    const startCamera = async () => {
      setCameraError("");
      setIsCameraLoading(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not support direct camera capture.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraTarget === "passport" ? "user" : { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setCameraError(err?.message || "Could not access the device camera.");
      } finally {
        if (active) {
          setIsCameraLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraTarget]);

  const captureCameraFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not capture the image. Try again.");
          return;
        }

        const fileName =
          cameraTarget === "passport"
            ? `passport-photo-${Date.now()}.jpg`
            : `id-document-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });

        if (cameraTarget === "passport") {
          setPassportFile(file);
        } else {
          setIdFile(file);
        }

        setCameraTarget(null);
      },
      "image/jpeg",
      0.92
    );
  };

  const actionLabel = (action) =>
    ({
      activate: "activate this account",
      deactivate: "deactivate this account",
      ban: "ban this account",
      unban: "unban this account",
      force_password_reset: "force password reset",
      clear_password_reset: "clear password reset",
      delete: "delete this user",
    }[action] ?? "apply this action");

  const runConfirmedAction = async () => {
    if (!confirmAction?.user) return;

    try {
      if (confirmAction.action === "delete") {
        if (isProtectedAccount(confirmAction.user)) {
          toast.error("Administrator accounts cannot be deleted from Staff Management.");
          closeConfirm();
          return;
        }
        const response = await deleteUser({ user_id: confirmAction.user.id }).unwrap();
        toast.success(response?.message || "User deleted successfully.");
      } else {
        const response = await updateStaffStatus({
          user_id: confirmAction.user.id,
          action: confirmAction.action,
          reason,
        }).unwrap();
        toast.success(response?.message || "Staff account updated.");
      }
      closeConfirm();
      setSelectedUser(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not complete the staff action.");
    }
  };

  const submitStaffDocuments = async () => {
    if (!documentUser || (!passportFile && !idFile)) {
      toast.error("Choose a passport photo, an ID document, or both.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", documentUser.id);
    if (passportFile) {
      formData.append("passportPhoto", passportFile);
    }
    if (idFile) {
      formData.append("idDocument", idFile);
    }

    try {
      const response = await uploadStaffDocuments(formData).unwrap();
      toast.success(response?.message || "Staff documents uploaded.");
      closeDocumentDialog();
    } catch (err) {
      toast.error(err?.data?.message || "Could not upload staff documents.");
    }
  };

  const renderStatusChip = (user) => {
    const config = statusConfig[user.accountStatus] ?? statusConfig.inactive;

    return (
      <Chip
        size="small"
        label={config.label}
        sx={{
          bgcolor: config.background,
          color: config.color,
          fontWeight: 800,
          borderRadius: 1.5,
        }}
      />
    );
  };

  return (
    <Box
      className="staff-management-page"
      sx={{
        px: { xs: 2, md: 3 },
        py: 3,
        bgcolor: "var(--ampla-app-bg, #f8faf8)",
        color: "var(--ampla-text-color, #17251d)",
        minHeight: "100vh",
        "& .MuiPaper-root": staffSurfaceSx,
        "& .MuiInputBase-root": {
          bgcolor: "var(--ampla-input-bg, #ffffff)",
          color: "var(--ampla-text-color, #17251d)",
        },
        "& .MuiInputLabel-root, & .MuiInputAdornment-root, & .MuiSvgIcon-root": {
          color: "var(--ampla-muted-color, #647067)",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--ampla-border-color, #e6ece8)",
        },
        "& .MuiTableCell-root": {
          color: "var(--ampla-text-color, #17251d)",
          borderColor: "var(--ampla-border-color, #e6ece8)",
        },
        "& .MuiTableHead-root .MuiTableCell-root": {
          bgcolor: "var(--ampla-surface-soft, #f0f6f2)",
          color: "var(--ampla-muted-color, #647067)",
        },
        "& .MuiTableBody-root .MuiTableRow-root": {
          bgcolor: "var(--ampla-surface-bg, #ffffff)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "flex-start" }}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "var(--ampla-text-color, #17251d)", mb: 0.5 }}>
            Staff Management
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--ampla-muted-color, #647067)", maxWidth: 760 }}>
            Monitor staff access, online presence, account health, recent activity, and sensitive administrator actions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={isFetching ? <CircularProgress size={15} /> : <ArrowClockwise size={15} />}
            onClick={refetch}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid var(--ampla-border-color, #e6ece8)",
          overflow: "hidden",
          mb: 2,
        }}
      >
        <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 1.5 }}>
          <Tab label="Staff Control" />
          <Tab label="Account & Permission Editor" />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} lg={2.4}>
              <StatCard label="Total staff" value={visibleSummary.total} icon={PersonCheck} />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <StatCard label="Online now" value={visibleSummary.online} tone="#1570ef" icon={Activity} />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <StatCard label="Active accounts" value={visibleSummary.active} tone="#2f8f57" icon={CheckCircle} />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <StatCard label="Locked or banned" value={visibleSummary.inactive + visibleSummary.banned} tone="#b42318" icon={SlashCircle} />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <StatCard label="Reset pending" value={visibleSummary.passwordResetRequired} tone="#b54708" icon={Key} />
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid var(--ampla-border-color, #e6ece8)", mb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff, email, or role"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: { xs: "100%", md: 190 } }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All statuses</MenuItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <MenuItem key={value} value={value}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: { xs: "100%", md: 190 } }}>
                <InputLabel>Role</InputLabel>
                <Select value={roleFilter} label="Role" onChange={(event) => setRoleFilter(event.target.value)}>
                  <MenuItem value="all">All roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Staff overview could not be loaded. Check that your account has admin access and the API is running.
            </Alert>
          ) : null}

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: "1px solid var(--ampla-border-color, #e6ece8)" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--ampla-surface-soft, #f0f6f2)" }}>
                  <TableCell sx={{ fontWeight: 900 }}>Staff member</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Documents</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Roles</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Last seen</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Activity</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "var(--ampla-muted-color, #647067)" }}>
                      No staff members match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={toAssetUrl(user.documents?.passportPhotoPath)}
                            sx={{ bgcolor: "#2f8f57", fontWeight: 900 }}
                          >
                            {initials(user.username)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography sx={{ fontWeight: 900, color: "var(--ampla-text-color, #17251d)" }}>{user.username}</Typography>
                              {user.online ? (
                                <Chip size="small" label="Online" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
                              ) : null}
                            </Stack>
                            <Typography variant="body2" sx={{ color: "var(--ampla-muted-color, #647067)" }}>{user.email || "No email recorded"}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{renderStatusChip(user)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={user.documents?.passportPhotoPath ? "Photo" : "No photo"}
                            color={user.documents?.passportPhotoPath ? "success" : "default"}
                            variant={user.documents?.passportPhotoPath ? "filled" : "outlined"}
                          />
                          {user.documents?.idDocumentPath ? (
                            <Button
                              size="small"
                              href={toAssetUrl(user.documents.idDocumentPath)}
                              target="_blank"
                              rel="noreferrer"
                              sx={{ minHeight: 24, py: 0, textTransform: "none", fontWeight: 800 }}
                            >
                              ID file
                            </Button>
                          ) : (
                            <Chip size="small" label="No ID" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {(user.roles ?? EMPTY_ARRAY).slice(0, 3).map((role) => (
                            <Chip key={role} size="small" label={role} variant="outlined" />
                          ))}
                          {(user.roles ?? EMPTY_ARRAY).length > 3 ? <Chip size="small" label={`+${user.roles.length - 3}`} /> : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDateTime(user.lastSeenAt || user.lastLoginAt)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>{user.activityCount ?? 0} events</Typography>
                        <Typography variant="body2" sx={{ color: "var(--ampla-muted-color, #647067)" }}>{formatDateTime(user.lastActivityAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View activity">
                            <IconButton onClick={() => setSelectedUser(user)}><Eye size={17} /></IconButton>
                          </Tooltip>
                          <Tooltip title={user.isActive ? "Deactivate" : "Activate"}>
                            <IconButton onClick={() => openConfirm(user, user.isActive ? "deactivate" : "activate")}>
                              {user.isActive ? <PersonDash size={17} /> : <PersonCheck size={17} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isBanned ? "Unban" : "Ban"}>
                            <IconButton color={user.isBanned ? "success" : "warning"} onClick={() => openConfirm(user, user.isBanned ? "unban" : "ban")}>
                              <SlashCircle size={17} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.forcePasswordReset ? "Clear reset flag" : "Force password reset"}>
                            <IconButton onClick={() => openConfirm(user, user.forcePasswordReset ? "clear_password_reset" : "force_password_reset")}>
                              <Key size={17} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit roles in editor tab">
                            <IconButton onClick={() => setTab(1)}><PencilSquare size={17} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Upload staff documents">
                            <IconButton onClick={() => openDocumentDialog(user)}><ShieldLock size={17} /></IconButton>
                          </Tooltip>
                          {!isProtectedAccount(user) ? (
                            <Tooltip title="Delete user">
                              <IconButton color="error" onClick={() => openConfirm(user, "delete")}><Trash size={17} /></IconButton>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <AdminAccountManager />
      )}

      <Drawer anchor="right" open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        <Box sx={{ width: { xs: 340, sm: 460 }, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Staff Activity</Typography>
              <Typography variant="body2" sx={{ color: "#647067" }}>{selectedUser?.username}</Typography>
            </Box>
            <IconButton onClick={() => setSelectedUser(null)}><X /></IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {selectedUser ? (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e6ece8", borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <ShieldLock size={17} />
                  <Typography sx={{ fontWeight: 900 }}>Account snapshot</Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {renderStatusChip(selectedUser)}
                  <Chip size="small" label={selectedUser.online ? "Online" : "Offline"} />
                  <Chip size="small" label={`${selectedUser.loginCount ?? 0} logins`} />
                </Stack>
              </Paper>
              <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e6ece8", borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={toAssetUrl(selectedUser.documents?.passportPhotoPath)}
                    sx={{ width: 56, height: 56, bgcolor: "#2f8f57", fontWeight: 900 }}
                  >
                    {initials(selectedUser.username)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>Staff documents</Typography>
                    <Typography variant="body2" sx={{ color: "#647067" }}>
                      {selectedUser.documents?.idDocumentName || "No ID document uploaded"}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => openDocumentDialog(selectedUser)} sx={{ textTransform: "none", fontWeight: 800 }}>
                    Upload
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          ) : null}

          {isActivityFetching ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Recent system actions</Typography>
                {(activityData?.activity ?? EMPTY_ARRAY).length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#647067" }}>No audited actions recorded yet.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {activityData.activity.map((event) => (
                      <Paper key={event.id} elevation={0} sx={{ p: 1.5, border: "1px solid #e6ece8", borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 800 }}>{event.action}</Typography>
                        <Typography variant="body2" sx={{ color: "#647067" }}>
                          {event.entityType} {event.entityId ? `#${event.entityId}` : ""} - {formatDateTime(event.auditDateCreated)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Login history</Typography>
                {(activityData?.logins ?? EMPTY_ARRAY).length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#647067" }}>No login records found.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {activityData.logins.map((login) => (
                      <Paper key={login.id} elevation={0} sx={{ p: 1.5, border: "1px solid #e6ece8", borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography sx={{ fontWeight: 800 }}>{login.success ? "Successful login" : "Failed login"}</Typography>
                          <Chip size="small" label={login.ip_address || "No IP"} />
                        </Stack>
                        <Typography variant="body2" sx={{ color: "#647067" }}>{formatDateTime(login.date)}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </Box>
      </Drawer>

      <Dialog open={Boolean(confirmAction)} onClose={closeConfirm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm staff action</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            You are about to {actionLabel(confirmAction?.action)} for{" "}
            <strong>{confirmAction?.user?.username}</strong>.
          </Typography>
          {["ban", "deactivate"].includes(confirmAction?.action) ? (
            <TextField
              label="Reason or internal note"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeConfirm} sx={{ textTransform: "none", fontWeight: 800 }}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction?.action === "delete" ? "error" : "primary"}
            onClick={runConfirmedAction}
            disabled={isActionLoading || isDeleteLoading}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {isActionLoading || isDeleteLoading ? "Working..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(documentUser)} onClose={closeDocumentDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Upload staff documents</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Add or replace passport photo and ID document for <strong>{documentUser?.username}</strong>.
          </Typography>
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e6ece8", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Passport photo</Typography>
              <Typography variant="body2" sx={{ color: "#647067", mb: 1.5 }}>
                JPG, PNG, or WEBP up to 2 MB.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 800 }}>
                  Choose photo
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setPassportFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 800 }}>
                  Scanner import
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setPassportFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button component="label" variant="outlined" startIcon={<Camera size={16} />} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Mobile camera
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(event) => setPassportFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Camera size={16} />}
                  onClick={() => setCameraTarget("passport")}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  Webcam
                </Button>
              </Stack>
              {passportFile ? (
                <Typography variant="body2" sx={{ mt: 1, color: "#17251d" }}>{passportFile.name}</Typography>
              ) : null}
            </Paper>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e6ece8", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.5 }}>ID document</Typography>
              <Typography variant="body2" sx={{ color: "#647067", mb: 1.5 }}>
                PDF, JPG, PNG, or WEBP up to 5 MB.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 800 }}>
                  Choose ID file
                  <input
                    hidden
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 800 }}>
                  Scanner/PDF
                  <input
                    hidden
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button component="label" variant="outlined" startIcon={<Camera size={16} />} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Mobile camera
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Camera size={16} />}
                  onClick={() => setCameraTarget("id")}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  Webcam
                </Button>
              </Stack>
              {idFile ? (
                <Typography variant="body2" sx={{ mt: 1, color: "#17251d" }}>{idFile.name}</Typography>
              ) : null}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDocumentDialog} sx={{ textTransform: "none", fontWeight: 800 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitStaffDocuments}
            disabled={isUploadingDocuments}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {isUploadingDocuments ? "Uploading..." : "Upload documents"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(cameraTarget)} onClose={() => setCameraTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {cameraTarget === "passport" ? "Capture passport photo" : "Capture ID document"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#647067", mb: 1.5 }}>
            Position the document clearly inside the frame, then capture it for upload.
          </Typography>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#0f172a",
              border: "1px solid #dbe5dd",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            {isCameraLoading ? (
              <CircularProgress sx={{ color: "#ffffff" }} />
            ) : null}
            {cameraError ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {cameraError}
              </Alert>
            ) : null}
            <Box
              component="video"
              ref={videoRef}
              muted
              playsInline
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraError ? "none" : "block",
              }}
            />
            <Box component="canvas" ref={canvasRef} sx={{ display: "none" }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCameraTarget(null)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Camera size={16} />}
            onClick={captureCameraFrame}
            disabled={isCameraLoading || Boolean(cameraError)}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagementPage;
