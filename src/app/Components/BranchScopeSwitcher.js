import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SignpostSplit } from "react-bootstrap-icons";
import { toast } from "react-toastify";

import { selectRoles, selectBranchScope } from "../auth/authSlice";
import {
  selectBranches,
  useGetBranchesQuery,
  useSwitchBranchMutation,
} from "../features/api/branchesSlice";
import { useSettings } from "./Settings";

const EMPTY_ARRAY = [];

const palette = {
  green: "#2f8f57",
  muted: "#697586",
  text: "#15202b",
};

const BranchScopeSwitcher = () => {
  const { settings } = useSettings();
  const roles = useSelector(selectRoles) ?? EMPTY_ARRAY;
  const branchScope = useSelector(selectBranchScope);
  const branches = useSelector(selectBranches) ?? EMPTY_ARRAY;
  const { isFetching } = useGetBranchesQuery();
  const [switchBranch, { isLoading: isSwitching }] = useSwitchBranchMutation();

  const isDark = settings?.theme === "dark";
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches) || roles.includes("admin");
  const effectiveBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";

  const currentBranchName = useMemo(() => {
    const match = branches.find(
      (branch) => String(branch?.branchId) === String(effectiveBranchId)
    );

    return match?.branchName || (effectiveBranchId ? `Branch #${effectiveBranchId}` : "All Branches");
  }, [branches, effectiveBranchId]);

  const handleBranchChange = async (event) => {
    const nextBranchId = event.target.value;
    if (String(nextBranchId) === String(effectiveBranchId)) {
      return;
    }

    try {
      const response = await switchBranch({
        branchId: nextBranchId === "" ? "" : nextBranchId,
      }).unwrap();
      toast.success(response?.message || "Branch switched successfully.");
    } catch (error) {
      toast.error(error?.data?.message || "Branch switch failed.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        justifyContent: { xs: "flex-start", md: "flex-end" },
        width: "100%",
      }}
    >
      <Chip
        icon={<SignpostSplit size={14} />}
        label={`Current Branch: ${currentBranchName}`}
        sx={{
          maxWidth: { xs: "100%", md: 260 },
          height: 40,
          px: 1,
          bgcolor: isDark ? alpha(palette.green, 0.18) : "#ecf7f0",
          color: isDark ? "#d9f3e2" : palette.green,
          borderRadius: 999,
          fontWeight: 700,
          border: `1px solid ${isDark ? alpha(palette.green, 0.24) : alpha(palette.green, 0.12)}`,
          "& .MuiChip-label": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .MuiChip-icon": {
            color: "inherit",
          },
        }}
      />

      {canSwitchBranches ? (
        <FormControl size="small" sx={{ minWidth: 230, flex: { xs: "1 1 100%", md: "0 0 auto" } }}>
          <Typography
            variant="caption"
            sx={{
              mb: 0.5,
              ml: 1.5,
              color: isDark ? "#d9f3e2" : palette.muted,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Quick branch switch
          </Typography>
          <Select
            value={effectiveBranchId}
            onChange={handleBranchChange}
            displayEmpty
            disabled={isSwitching || isFetching}
            renderValue={(selected) => {
              if (!selected) {
                return "Working Branch: All Branches";
              }

              const match = branches.find((branch) => String(branch.branchId) === String(selected));
              return `Working Branch: ${match?.branchName || "Unknown Branch"}`;
            }}
            sx={{
              minHeight: 40,
              borderRadius: 999,
              bgcolor: isDark ? alpha("#111917", 0.92) : "#ffffff",
              color: isDark ? "#edf3ef" : palette.text,
              fontWeight: 700,
            }}
            endAdornment={
              isSwitching ? (
                <CircularProgress size={16} sx={{ mr: 3, color: palette.green }} />
              ) : null
            }
          >
            <MenuItem value="">
              All Branches
            </MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.branchId} value={String(branch.branchId)}>
                {branch.branchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Chip
          label="Branch locked to your account"
          sx={{
            height: 36,
            color: isDark ? "#d9f3e2" : palette.muted,
            bgcolor: "transparent",
            border: `1px solid ${isDark ? alpha(palette.green, 0.24) : alpha(palette.green, 0.12)}`,
            fontWeight: 700,
          }}
        />
      )}
    </Box>
  );
};

export default BranchScopeSwitcher;
