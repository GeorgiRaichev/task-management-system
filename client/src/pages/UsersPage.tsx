import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
  type ChipProps,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";

import { useAppSelector } from "../app/hooks";
import {
  UserRole,
  type User,
  type UserRole as UserRoleType,
} from "../features/auth/types";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
} from "../features/users/usersApi";
import { useTranslate } from "../hooks/useTranslate";
import type { TranslationKey } from "../i18n/translations";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDate } from "../utils/date";
import {
  canCreateUser,
  canDeleteUser,
  canEditUser,
} from "../utils/permissions";

type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRoleType;
  isActive: boolean;
};

const initialFormData: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: UserRole.REGISTERED_USER,
  isActive: true,
};

const roleLabels: Record<UserRoleType, TranslationKey> = {
  [UserRole.REGISTERED_USER]: "registered_user",
  [UserRole.PROJECT_MANAGER]: "project_manager",
  [UserRole.ADMINISTRATOR]: "administrator",
};

const getRoleColor = (role: UserRoleType): ChipProps["color"] => {
  if (role === UserRole.ADMINISTRATOR) {
    return "error";
  }

  if (role === UserRole.PROJECT_MANAGER) {
    return "primary";
  }

  return "default";
};

export default function UsersPage() {
  const theme = useTheme();
  const translate = useTranslate();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const { data, isLoading, isFetching } = useGetUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");

  const users = data?.users || [];
  const isEditMode = Boolean(selectedUser);
  const isSubmitting = isCreating || isUpdating;
  const hasAnyUserActions = users.some(
    (item) => canEditUser(currentUser) || canDeleteUser(currentUser, item),
  );

  const pageTitle = useMemo(() => {
    if (isEditMode) {
      return translate("editUser");
    }

    return translate("createUser");
  }, [isEditMode, translate]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData(initialFormData);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setError("");
    setUserToDelete(user);
  };

  const handleCloseForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setSelectedUser(null);
    setFormData(initialFormData);
    setError("");
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setUserToDelete(null);
    setError("");
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      if (selectedUser) {
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          ...(formData.password ? { password: formData.password } : {}),
        };

        await updateUser({
          userId: selectedUser._id,
          data: updateData,
        }).unwrap();
      } else {
        await createUser(formData).unwrap();
      }

      handleCloseForm();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      await deleteUser(userToDelete._id).unwrap();
      setUserToDelete(null);
      setError("");
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 3,
          borderRadius: 5,
          background: "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)",
          color: "common.white",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 4,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha("#ffffff", 0.16),
                border: `1px solid ${alpha("#ffffff", 0.24)}`,
              }}
            >
              <GroupRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h4">{translate("users")}</Typography>
              <Typography sx={{ opacity: 0.78 }}>
                {users.length} {translate("users").toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          {canCreateUser(currentUser) && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: "common.white",
                color: "secondary.main",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.9),
                },
              }}
            >
              {translate("createUser")}
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        {isLoading || isFetching ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6">{translate("noData")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {translate("createUser")}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  }}
                >
                  <TableCell>{translate("fullName")}</TableCell>
                  <TableCell>{translate("email")}</TableCell>
                  <TableCell>{translate("role")}</TableCell>
                  <TableCell>{translate("accountStatus")}</TableCell>
                  <TableCell>{translate("createdAt")}</TableCell>
                  {hasAnyUserActions && (
                    <TableCell align="right">{translate("actions")}</TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {users.map((user) => {
                  const showEdit = canEditUser(currentUser);
                  const showDelete = canDeleteUser(currentUser, user);

                  return (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </TableCell>

                      <TableCell>{user.email}</TableCell>

                      <TableCell>
                        <Chip
                          label={translate(roleLabels[user.role])}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            user.isActive
                              ? translate("activeAccount")
                              : translate("inactiveAccount")
                          }
                          color={user.isActive ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(user.createdAt, translate("notAvailable"))}
                      </TableCell>

                      {hasAnyUserActions && (
                        <TableCell align="right">
                          {showEdit && (
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <EditRoundedIcon />
                            </IconButton>
                          )}

                          {showDelete && (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDelete(user)}
                            >
                              <DeleteRoundedIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{pageTitle}</DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  name="firstName"
                  label={translate("firstName")}
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  required
                />

                <TextField
                  name="lastName"
                  label={translate("lastName")}
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Box>

              <TextField
                name="email"
                label={translate("email")}
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                name="password"
                label={translate("password")}
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required={!isEditMode}
                helperText={isEditMode ? translate("leavePasswordEmpty") : ""}
              />

              <TextField
                name="role"
                label={translate("role")}
                value={formData.role}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value={UserRole.REGISTERED_USER}>
                  {translate("registered_user")}
                </MenuItem>
                <MenuItem value={UserRole.PROJECT_MANAGER}>
                  {translate("project_manager")}
                </MenuItem>
                <MenuItem value={UserRole.ADMINISTRATOR}>
                  {translate("administrator")}
                </MenuItem>
              </TextField>

              <TextField
                name="isActive"
                label={translate("accountStatus")}
                value={String(formData.isActive)}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="true">{translate("activeAccount")}</MenuItem>
                <MenuItem value="false">
                  {translate("inactiveAccount")}
                </MenuItem>
              </TextField>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseForm} disabled={isSubmitting}>
              {translate("cancel")}
            </Button>

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isEditMode ? translate("save") : translate("create")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(userToDelete)}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{translate("deleteUser")}</DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography>{translate("confirmDelete")}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} disabled={isDeleting}>
            {translate("cancel")}
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {translate("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
