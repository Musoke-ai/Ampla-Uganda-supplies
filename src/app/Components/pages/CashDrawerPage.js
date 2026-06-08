import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccountBalanceWallet,
  AddCircleOutline,
  Assessment,
  Factory,
  Lock,
  Payments,
  PointOfSale,
  ReceiptLong,
  RemoveCircleOutline,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { selectBranchScope, selectRoles } from "../../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import {
  useCloseCashDrawerMutation,
  useGetActiveCashDrawerQuery,
  useGetCashDrawerHistoryQuery,
  useOpenCashDrawerMutation,
  useRecordCashDrawerExpenseMutation,
  useRecordCashDrawerMovementMutation,
} from "../../features/api/cashDrawerSlice";
import { useSettings } from "../Settings";
import {
  formatCurrency,
  formatCurrencyInputValue,
  parseCurrencyInput,
} from "../../utils/currency";
import "./WorkspacePages.css";

const EMPTY_ARRAY = [];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const canAccessRoute = (allowedRoles = [], currentRoles = []) =>
  allowedRoles.some((role) => currentRoles.includes(role));

const drawerActionLabels = {
  open: "Open Cash Drawer",
  cash_in: "Record Cash In",
  cash_out: "Record Cash Out",
  close: "Close Cash Drawer",
};

export default function CashDrawerPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const currency = settings?.currency && settings.currency !== "none" ? settings.currency : "UGX";
  const money = (value) => formatCurrency(value, currency);

  const branchScope = useSelector(selectBranchScope) ?? {};
  const roles = useSelector(selectRoles) ?? EMPTY_ARRAY;
  const branches = useSelector(selectBranches) ?? EMPTY_ARRAY;
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
  const scopedBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
  const [selectedBranchId, setSelectedBranchId] = useState(scopedBranchId);
  const [dialog, setDialog] = useState({ open: false, action: "open" });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("POS Expense");
  const [expenseGivenTo, setExpenseGivenTo] = useState("");
  const [expenseRemarks, setExpenseRemarks] = useState("");
  const [feedback, setFeedback] = useState({ severity: "", message: "" });

  useGetBranchesQuery();

  useEffect(() => {
    if (!canSwitchBranches && scopedBranchId && selectedBranchId !== scopedBranchId) {
      setSelectedBranchId(scopedBranchId);
    }
  }, [canSwitchBranches, scopedBranchId, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch.branchId) === String(selectedBranchId)) || null,
    [branches, selectedBranchId]
  );

  const {
    data: activeDrawer,
    isFetching,
    refetch,
  } = useGetActiveCashDrawerQuery({ branchId: selectedBranchId }, { skip: !selectedBranchId });
  const { data: drawerHistory = [] } = useGetCashDrawerHistoryQuery(
    { branchId: selectedBranchId },
    { skip: !selectedBranchId }
  );
  const [openCashDrawer, { isLoading: isOpening }] = useOpenCashDrawerMutation();
  const [recordMovement, { isLoading: isRecording }] = useRecordCashDrawerMovementMutation();
  const [recordExpense, { isLoading: isRecordingExpense }] = useRecordCashDrawerExpenseMutation();
  const [closeCashDrawer, { isLoading: isClosing }] = useCloseCashDrawerMutation();

  const paymentSummary = activeDrawer?.paymentSummary || {};
  const recentMovements = activeDrawer?.movements?.slice(0, 8) || [];
  const isSaving = isOpening || isRecording || isRecordingExpense || isClosing;

  const openDialog = (action) => {
    setDialog({ open: true, action, expenseMode: false });
    setAmount("");
    setNote("");
    setExpenseCategory("POS Expense");
    setExpenseGivenTo("");
    setExpenseRemarks("");
  };

  const openExpenseDialog = () => {
    if (!activeDrawer) {
      setFeedback({ severity: "warning", message: "Open the cash drawer before recording a cash expense." });
      return;
    }

    setDialog({ open: true, action: "cash_out", expenseMode: true });
    setAmount("");
    setNote("");
    setExpenseCategory("POS Expense");
    setExpenseGivenTo("");
    setExpenseRemarks("");
  };

  const goTo = (path) => {
    navigate(path);
  };

  const drawerLocked = !selectedBranchId || !activeDrawer;
  const quickOperations = [
    {
      title: "POS",
      note: "Start or continue selling.",
      icon: PointOfSale,
      action: () => goTo("/home/pos"),
      disabled: false,
      allowedRoles: ["admin", "salesdesk", "accountant"],
    },
    {
      title: "Record Expense",
      note: "Save expense and cash-out.",
      icon: RemoveCircleOutline,
      action: openExpenseDialog,
      disabled: !selectedBranchId,
    },
    activeDrawer
      ? {
          title: "Cash In",
          note: "Add extra physical cash.",
          icon: AddCircleOutline,
          action: () => openDialog("cash_in"),
          disabled: drawerLocked,
        }
      : {
          title: "Open Drawer",
          note: "Start the branch float.",
          icon: AccountBalanceWallet,
          action: () => openDialog("open"),
          disabled: !selectedBranchId,
        },
    {
      title: "Cash Out",
      note: "Withdraw petty cash or payout.",
      icon: RemoveCircleOutline,
      action: () => openDialog("cash_out"),
      disabled: drawerLocked,
    },
    {
      title: "Close Drawer",
      note: "Count cash and lock the shift.",
      icon: Lock,
      action: () => openDialog("close"),
      disabled: drawerLocked,
    },
    {
      title: "Sales",
      note: "Review sales by product or customer.",
      icon: Assessment,
      action: () => goTo("/home/sales"),
      disabled: false,
      allowedRoles: ["admin", "sales", "accountant"],
    },
    {
      title: "Receipts",
      note: "Open receipt and document records.",
      icon: ReceiptLong,
      action: () => goTo("/home/documents"),
      disabled: false,
      allowedRoles: ["admin"],
    },
    {
      title: "Production Expenses",
      note: "Manage detailed expense records.",
      icon: Factory,
      action: () => goTo("/home/production?tab=Expenses"),
      disabled: false,
      allowedRoles: ["admin", "rawmaterials", "expenses", "orders", "employees", "productionmanager", "productionmanger"],
    },
  ].filter((operation) => !operation.allowedRoles || canAccessRoute(operation.allowedRoles, roles));

  const closeDialog = () => {
    setDialog({ open: false, action: "open", expenseMode: false });
    setAmount("");
    setNote("");
    setExpenseCategory("POS Expense");
    setExpenseGivenTo("");
    setExpenseRemarks("");
  };

  const handleSubmit = async () => {
    try {
      const numericAmount = toNumber(amount);

      if (dialog.action === "open") {
        await openCashDrawer({
          branchId: selectedBranchId,
          openingFloat: numericAmount,
          note,
        }).unwrap();
        setFeedback({ severity: "success", message: "Cash drawer opened." });
      } else if (dialog.action === "cash_in" || dialog.action === "cash_out") {
        if (dialog.expenseMode) {
          await recordExpense({
            drawerId: activeDrawer.drawerId,
            amount: numericAmount,
            category: expenseCategory,
            description: note,
            givenTo: expenseGivenTo,
            remarks: expenseRemarks,
          }).unwrap();
          setFeedback({ severity: "success", message: "Expense and drawer cash-out recorded." });
        } else {
          await recordMovement({
            drawerId: activeDrawer.drawerId,
            movementType: dialog.action,
            amount: numericAmount,
            reason: note,
          }).unwrap();
          setFeedback({ severity: "success", message: "Drawer movement recorded." });
        }
      } else if (dialog.action === "close") {
        await closeCashDrawer({
          drawerId: activeDrawer.drawerId,
          countedCash: numericAmount,
          note,
        }).unwrap();
        setFeedback({ severity: "success", message: "Cash drawer closed." });
      }

      closeDialog();
      refetch();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error?.data?.message || error?.error || "Cash drawer action failed.",
      });
    }
  };

  return (
    <Box className="workspace-page-shell">
      <Stack gap={3}>
        <header className="workspace-page-hero">
          <Box>
            <Typography className="workspace-page-title" component="h2">
              Cash Drawer
            </Typography>
            <Typography className="workspace-page-subtitle">
              Control physical cash, review cashless sales, and close each branch shift with a clean variance.
            </Typography>
          </Box>
        </header>

        {feedback.message ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback({ severity: "", message: "" })}>
            {feedback.message}
          </Alert>
        ) : null}

        <Card sx={cardStyle}>
          <Stack direction={{ xs: "column", md: "row" }} gap={2} justifyContent="space-between">
            <Box>
              <Typography fontWeight={900} fontSize={20}>Drawer Branch</Typography>
              <Typography color="var(--ampla-muted-color, #64748B)">
                {selectedBranch ? selectedBranch.branchName : "Select a branch to manage drawer activity."}
              </Typography>
            </Box>
            <FormControl sx={{ minWidth: 260 }}>
              <Select
                displayEmpty
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                disabled={!canSwitchBranches}
              >
                <MenuItem value="">Select branch</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.branchId} value={String(branch.branchId)}>
                    {branch.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Card>

        <Card sx={cardStyle}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2} mb={2}>
            <Box>
              <Typography fontWeight={900} fontSize={20}>Quick Operations</Typography>
              <Typography color="var(--ampla-muted-color, #64748B)">
                Fast counter actions for the cashier without leaving the drawer workflow.
              </Typography>
            </Box>
            {activeDrawer ? (
              <Chip
                label={`Expected cash: ${money(activeDrawer.expectedCash)}`}
                sx={{ bgcolor: "var(--ampla-accent-soft, #E7F6ED)", color: "var(--ampla-accent-color, #237B49)", fontWeight: 900, width: "fit-content" }}
              />
            ) : null}
          </Stack>
          <Box sx={quickGridStyle}>
            {quickOperations.map((operation) => (
              <QuickOperation key={operation.title} operation={operation} />
            ))}
          </Box>
        </Card>

        <Box sx={mainGridStyle}>
          <Card sx={cardStyle}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Stack direction="row" gap={1} alignItems="center">
                  <AccountBalanceWallet sx={{ color: "var(--ampla-accent-color, #2F8F57)" }} />
                  <Typography fontWeight={900} fontSize={22}>
                    Current Drawer
                  </Typography>
                </Stack>
                <Typography color="var(--ampla-muted-color, #64748B)">
                  {activeDrawer
                    ? `Opened ${new Date(activeDrawer.openedAt).toLocaleString()}`
                    : isFetching
                      ? "Checking drawer status..."
                      : "No open drawer for this branch."}
                </Typography>
              </Box>
              <Chip
                label={activeDrawer ? "Open" : "Closed"}
                sx={{
                  bgcolor: activeDrawer ? "var(--ampla-accent-soft, #E7F6ED)" : "var(--ampla-surface-soft, #F1F5F9)",
                  color: activeDrawer ? "var(--ampla-accent-color, #237B49)" : "var(--ampla-muted-color, #64748B)",
                  fontWeight: 900,
                }}
              />
            </Stack>

            {activeDrawer ? (
              <>
                <Box sx={metricGridStyle}>
                  <Metric title="Opening Float" value={money(activeDrawer.openingFloat)} />
                  <Metric title="Cash Sales" value={money(activeDrawer.cashSalesTotal)} />
                  <Metric title="Cash In" value={money(activeDrawer.cashInTotal)} />
                  <Metric title="Cash Out" value={money(activeDrawer.cashOutTotal)} />
                  <Metric title="Expected Cash" value={money(activeDrawer.expectedCash)} strong />
                  <Metric title="Cashless Sales" value={money(paymentSummary.cashless)} />
                  <Metric title="Credit Due" value={money(paymentSummary.creditDue)} />
                  <Metric title="Receipts" value={paymentSummary.totalReceipts || 0} />
                </Box>

                <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                  <Button variant="outlined" sx={outlineButtonStyle} onClick={() => openDialog("cash_in")}>
                    Cash In
                  </Button>
                  <Button variant="outlined" sx={outlineButtonStyle} onClick={() => openDialog("cash_out")}>
                    Cash Out
                  </Button>
                  <Button variant="contained" sx={greenButtonStyle} onClick={() => openDialog("close")}>
                    Close Drawer
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack alignItems="center" gap={2} sx={{ py: 5 }}>
                <Payments sx={{ fontSize: 44, color: "var(--ampla-accent-color, #2F8F57)" }} />
                <Typography color="var(--ampla-muted-color, #64748B)" textAlign="center">
                  Open a drawer before the cashier starts receiving physical cash.
                </Typography>
                <Button
                  variant="contained"
                  sx={greenButtonStyle}
                  disabled={!selectedBranchId}
                  onClick={() => openDialog("open")}
                >
                  Open Cash Drawer
                </Button>
              </Stack>
            )}
          </Card>

          <Card sx={cardStyle}>
            <Typography fontWeight={900} fontSize={20} mb={1}>
              Cashless Handling
            </Typography>
            <Typography color="var(--ampla-muted-color, #64748B)" mb={2}>
              Mobile money, card, bank, and other non-cash payments are kept on receipts and shift totals, but they do not change expected physical cash.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack gap={1.2}>
              {Object.entries(paymentSummary.methods || {}).length ? (
                Object.entries(paymentSummary.methods).map(([method, value]) => (
                  <Stack key={method} direction="row" justifyContent="space-between">
                    <Typography color="var(--ampla-muted-color, #64748B)">{method}</Typography>
                    <Typography fontWeight={900}>{money(value)}</Typography>
                  </Stack>
                ))
              ) : (
                <Typography color="var(--ampla-muted-color, #94A3B8)">No payments recorded for this drawer session yet.</Typography>
              )}
            </Stack>
          </Card>
        </Box>

        <Box sx={mainGridStyle}>
          <Card sx={cardStyle}>
            <Typography fontWeight={900} fontSize={20} mb={2}>
              Recent Movements
            </Typography>
            <Stack gap={1.2}>
              {recentMovements.length ? (
                recentMovements.map((movement) => (
                  <Box key={movement.movementId} sx={movementStyle}>
                    <Box>
                      <Typography fontWeight={900}>
                        {String(movement.movementType).replace(/_/g, " ")}
                      </Typography>
                      <Typography color="var(--ampla-muted-color, #64748B)" variant="body2">
                        {movement.reason || "No note"} - {new Date(movement.movementDateCreated).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography fontWeight={900} color={Number(movement.amount) < 0 ? "#C2410C" : "var(--ampla-accent-color, #237B49)"}>
                      {money(movement.amount)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="var(--ampla-muted-color, #94A3B8)">No drawer movements yet.</Typography>
              )}
            </Stack>
          </Card>

          <Card sx={cardStyle}>
            <Typography fontWeight={900} fontSize={20} mb={2}>
              Recent Drawer Closures
            </Typography>
            <Stack gap={1.2}>
              {drawerHistory.length ? (
                drawerHistory.slice(0, 6).map((drawer) => (
                  <Box key={drawer.drawerId} sx={movementStyle}>
                    <Box>
                      <Typography fontWeight={900}>
                        {drawer.status === "open" ? "Open drawer" : "Closed drawer"}
                      </Typography>
                      <Typography color="var(--ampla-muted-color, #64748B)" variant="body2">
                        {new Date(drawer.openedAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography fontWeight={900} color={Number(drawer.variance || 0) < 0 ? "#C2410C" : "var(--ampla-accent-color, #237B49)"}>
                      {drawer.status === "closed" ? money(drawer.variance) : money(drawer.expectedCash)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="var(--ampla-muted-color, #94A3B8)">No drawer history yet.</Typography>
              )}
            </Stack>
          </Card>
        </Box>
      </Stack>

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {dialog.expenseMode ? "Record Expense" : drawerActionLabels[dialog.action]}
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            {dialog.action === "close" && activeDrawer ? (
              <Alert severity="info">
                Expected cash is {money(activeDrawer.expectedCash)}. Enter the counted physical cash.
              </Alert>
            ) : null}
            {dialog.expenseMode ? (
              <TextField
                label="Expense category"
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
              />
            ) : null}
            <TextField
              type="text"
              inputMode="decimal"
              label={dialog.action === "close" ? "Counted cash" : dialog.action === "open" ? "Opening float" : "Amount"}
              value={formatCurrencyInputValue(amount)}
              onChange={(event) => setAmount(parseCurrencyInput(event.target.value))}
            />
            <TextField
              multiline
              minRows={2}
              label={
                dialog.expenseMode
                  ? "Expense description"
                  : dialog.action === "cash_in" || dialog.action === "cash_out"
                    ? "Reason"
                    : "Note"
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            {dialog.expenseMode ? (
              <>
                <TextField
                  label="Paid to"
                  value={expenseGivenTo}
                  onChange={(event) => setExpenseGivenTo(event.target.value)}
                />
                <TextField
                  multiline
                  minRows={2}
                  label="Remarks"
                  value={expenseRemarks}
                  onChange={(event) => setExpenseRemarks(event.target.value)}
                />
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2, fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" sx={greenButtonStyle} onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Metric({ title, value, strong = false }) {
  return (
    <Box sx={metricStyle}>
      <Typography variant="caption" color="var(--ampla-muted-color, #64748B)">{title}</Typography>
      <Typography fontWeight={900} fontSize={strong ? 20 : 16}>{value}</Typography>
    </Box>
  );
}

function QuickOperation({ operation }) {
  const Icon = operation.icon;

  return (
    <Button
      variant="outlined"
      disabled={operation.disabled}
      onClick={operation.action}
      sx={quickOperationStyle}
    >
      <Box sx={quickIconStyle}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, textAlign: "left" }}>
        <Typography fontWeight={900} color="inherit">{operation.title}</Typography>
        <Typography variant="caption" sx={{ color: operation.disabled ? "var(--ampla-muted-color, #94A3B8)" : "var(--ampla-muted-color, #64748B)" }}>
          {operation.note}
        </Typography>
      </Box>
    </Button>
  );
}

const cardStyle = {
  p: 3,
  borderRadius: 4,
  border: "1px solid var(--ampla-border-color, #E7EFE9)",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(300px, 0.85fr)" },
  gap: 2,
};

const quickGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" },
  gap: 1.2,
};

const quickOperationStyle = {
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 1.2,
  minHeight: 78,
  p: 1.4,
  borderRadius: 3,
  borderColor: "var(--ampla-border-color, #D7E7DC)",
  color: "var(--ampla-text-color, #173B2D)",
  textTransform: "none",
  bgcolor: "var(--ampla-surface-soft, #FBFEFC)",
  "&:hover": {
    borderColor: "var(--ampla-accent-color, #9BC4AA)",
    bgcolor: "var(--ampla-surface-soft, #F4FBF6)",
  },
};

const quickIconStyle = {
  width: 40,
  height: 40,
  borderRadius: 2,
  display: "grid",
  placeItems: "center",
  bgcolor: "var(--ampla-accent-soft, #E7F6ED)",
  color: "var(--ampla-accent-color, #237B49)",
  flex: "0 0 auto",
};

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
  gap: 1.5,
};

const metricStyle = {
  p: 1.5,
  borderRadius: 3,
  bgcolor: "var(--ampla-surface-soft, #FBFEFC)",
  border: "1px solid var(--ampla-border-color, #E7EFE9)",
};

const movementStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 1.5,
  alignItems: "center",
  p: 1.5,
  borderRadius: 3,
  bgcolor: "var(--ampla-surface-soft, #FBFEFC)",
  border: "1px solid var(--ampla-border-color, #E7EFE9)",
};

const greenButtonStyle = {
  borderRadius: 2.5,
  bgcolor: "var(--ampla-accent-color, #2F8F57)",
  fontWeight: 800,
  textTransform: "none",
  boxShadow: "0 10px 25px rgba(47,143,87,.22)",
  "&:hover": { bgcolor: "var(--ampla-accent-color, #267347)" },
};

const outlineButtonStyle = {
  borderRadius: 2.5,
  borderColor: "#BFD8C8",
  color: "var(--ampla-accent-color, #237B49)",
  fontWeight: 800,
  textTransform: "none",
};
