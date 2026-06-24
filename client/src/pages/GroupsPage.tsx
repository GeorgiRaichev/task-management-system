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
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";

import { useAppSelector } from "../app/hooks";
import {
  ProjectGroupMemberRole,
  type ProjectGroup,
  type ProjectGroupMemberRole as ProjectGroupMemberRoleType,
} from "../features/groups/types";
import {
  useAddMemberMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupsQuery,
  useRemoveMemberMutation,
  useUpdateGroupMutation,
} from "../features/groups/groupsApi";
import { useGetProjectsQuery } from "../features/projects/projectsApi";
import { useGetUsersQuery } from "../features/users/usersApi";
import { useTranslate } from "../hooks/useTranslate";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDate } from "../utils/date";
import {
  canCreateGroupForProject,
  canDeleteGroup,
  canEditGroup,
  canManageGroupMembers,
} from "../utils/permissions";

type GroupFormData = {
  name: string;
  projectId: string;
};

type LocalMember = {
  userId: string;
  role: ProjectGroupMemberRoleType;
};

const initialFormData: GroupFormData = {
  name: "",
  projectId: "",
};

const getMemberRoleColor = (
  role: ProjectGroupMemberRoleType,
): ChipProps["color"] => {
  if (role === ProjectGroupMemberRole.MANAGER) {
    return "primary";
  }

  return "default";
};

export default function GroupsPage() {
  const theme = useTheme();
  const translate = useTranslate();
  const { user } = useAppSelector((state) => state.auth);

  const {
    data: groupsData,
    isLoading,
    isFetching,
  } = useGetGroupsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: projectsData } = useGetProjectsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: usersData } = useGetUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  const [addMember, { isLoading: isAddingMember }] = useAddMemberMutation();
  const [removeMember, { isLoading: isRemovingMember }] =
    useRemoveMemberMutation();

  const [formData, setFormData] = useState<GroupFormData>(initialFormData);
  const [formMembers, setFormMembers] = useState<LocalMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<ProjectGroup | null>(null);
  const [groupToManage, setGroupToManage] = useState<ProjectGroup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectGroupMemberRoleType>(
    ProjectGroupMemberRole.MEMBER,
  );
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectGroupMemberRoleType>(
    ProjectGroupMemberRole.MEMBER,
  );
  const [error, setError] = useState("");

  const groups = groupsData?.groups || [];
  const projects = projectsData?.projects || [];
  const users = usersData?.users || [];
  const availableProjectsForGroup = projects.filter((project) =>
    canCreateGroupForProject(project, user),
  );

  const isEditMode = Boolean(selectedGroup);
  const isSubmitting = isCreating || isUpdating;
  const canCreateAnyGroup = availableProjectsForGroup.length > 0;
  const hasAnyGroupActions = groups.some(
    (group) =>
      canManageGroupMembers(group, user) ||
      canEditGroup(group, user) ||
      canDeleteGroup(group, user),
  );

  const pageTitle = useMemo(() => {
    if (isEditMode) {
      return translate("editGroup");
    }

    return translate("createGroup");
  }, [isEditMode, translate]);

  const availableFormUsers = users.filter(
    (currentUser) =>
      !formMembers.some((member) => member.userId === currentUser._id),
  );

  const availableMemberUsers = users.filter(
    (currentUser) =>
      !groupToManage?.members.some(
        (member) => member.user._id === currentUser._id,
      ),
  );

  const handleOpenCreate = () => {
    setSelectedGroup(null);
    setFormData({
      name: "",
      projectId: availableProjectsForGroup[0]?._id || "",
    });
    setFormMembers([]);
    setSelectedUserId("");
    setSelectedRole(ProjectGroupMemberRole.MEMBER);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: ProjectGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      projectId: group.project?._id || "",
    });
    setFormMembers([]);
    setSelectedUserId("");
    setSelectedRole(ProjectGroupMemberRole.MEMBER);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenManageMembers = (group: ProjectGroup) => {
    setGroupToManage(group);
    setMemberUserId("");
    setMemberRole(ProjectGroupMemberRole.MEMBER);
    setError("");
  };

  const handleOpenDelete = (group: ProjectGroup) => {
    setGroupToDelete(group);
    setError("");
  };

  const handleCloseForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setSelectedGroup(null);
    setFormData(initialFormData);
    setFormMembers([]);
    setSelectedUserId("");
    setSelectedRole(ProjectGroupMemberRole.MEMBER);
    setError("");
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setGroupToDelete(null);
    setError("");
  };

  const handleCloseManageMembers = () => {
    if (isAddingMember || isRemovingMember) {
      return;
    }

    setGroupToManage(null);
    setMemberUserId("");
    setMemberRole(ProjectGroupMemberRole.MEMBER);
    setError("");
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAddFormMember = () => {
    if (!selectedUserId) {
      return;
    }

    setFormMembers((prev) => [
      ...prev,
      {
        userId: selectedUserId,
        role: selectedRole,
      },
    ]);
    setSelectedUserId("");
    setSelectedRole(ProjectGroupMemberRole.MEMBER);
  };

  const handleRemoveFormMember = (userId: string) => {
    setFormMembers((prev) => prev.filter((member) => member.userId !== userId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      if (selectedGroup) {
        await updateGroup({
          groupId: selectedGroup._id,
          data: {
            name: formData.name,
          },
        }).unwrap();
      } else {
        await createGroup({
          name: formData.name,
          projectId: formData.projectId,
          members: formMembers,
        }).unwrap();
      }

      handleCloseForm();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) {
      return;
    }

    try {
      await deleteGroup(groupToDelete._id).unwrap();
      setGroupToDelete(null);
      setError("");
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleAddExistingMember = async () => {
    if (!groupToManage || !memberUserId) {
      return;
    }

    setError("");

    try {
      const result = await addMember({
        groupId: groupToManage._id,
        userId: memberUserId,
        role: memberRole,
      }).unwrap();

      setGroupToManage(result.group);
      setMemberUserId("");
      setMemberRole(ProjectGroupMemberRole.MEMBER);
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleRemoveExistingMember = async (userId: string) => {
    if (!groupToManage) {
      return;
    }

    setError("");

    try {
      const result = await removeMember({
        groupId: groupToManage._id,
        userId,
      }).unwrap();

      setGroupToManage(result.group);
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const getUserName = (userId: string) => {
    const currentUser = users.find((item) => item._id === userId);

    if (!currentUser) {
      return translate("notAvailable");
    }

    return `${currentUser.firstName} ${currentUser.lastName}`;
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
              <GroupsRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h4">{translate("groups")}</Typography>
              <Typography sx={{ opacity: 0.78 }}>
                {groups.length} {translate("groups").toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          {canCreateAnyGroup && (
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
              {translate("createGroup")}
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        {isLoading || isFetching ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6">{translate("noData")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {canCreateAnyGroup
                ? translate("createGroup")
                : translate("groups")}
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
                  <TableCell>{translate("groupName")}</TableCell>
                  <TableCell>{translate("projectName")}</TableCell>
                  <TableCell>{translate("members")}</TableCell>
                  <TableCell>{translate("owner")}</TableCell>
                  <TableCell>{translate("createdAt")}</TableCell>
                  {hasAnyGroupActions && (
                    <TableCell align="right">{translate("actions")}</TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {groups.map((group) => {
                  const showManageMembers = canManageGroupMembers(group, user);
                  const showEdit = canEditGroup(group, user);
                  const showDelete = canDeleteGroup(group, user);

                  return (
                    <TableRow key={group._id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>
                          {group.name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {group.project?.name || translate("notAvailable")}
                      </TableCell>

                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          {group.members.slice(0, 3).map((member) => (
                            <Chip
                              key={member.user._id}
                              label={`${member.user.firstName} ${member.user.lastName}`}
                              size="small"
                              color={getMemberRoleColor(member.role)}
                              sx={{ fontWeight: 800 }}
                            />
                          ))}

                          {group.members.length > 3 && (
                            <Chip
                              label={`+${group.members.length - 3}`}
                              size="small"
                            />
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {group.createdBy
                          ? `${group.createdBy.firstName} ${group.createdBy.lastName}`
                          : translate("notAvailable")}
                      </TableCell>

                      <TableCell>
                        {formatDate(group.createdAt, translate("notAvailable"))}
                      </TableCell>

                      {hasAnyGroupActions && (
                        <TableCell align="right">
                          {showManageMembers && (
                            <IconButton
                              color="secondary"
                              onClick={() => handleOpenManageMembers(group)}
                            >
                              <GroupAddRoundedIcon />
                            </IconButton>
                          )}

                          {showEdit && (
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEdit(group)}
                            >
                              <EditRoundedIcon />
                            </IconButton>
                          )}

                          {showDelete && (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDelete(group)}
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

              <TextField
                name="name"
                label={translate("groupName")}
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                name="projectId"
                label={translate("selectProject")}
                value={formData.projectId}
                onChange={handleChange}
                fullWidth
                required
                select
                disabled={isEditMode}
              >
                {availableProjectsForGroup.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>

              {!isEditMode && (
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Typography sx={{ fontWeight: 800 }}>
                      {translate("members")}
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 160px auto",
                        },
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        label={translate("selectUser")}
                        value={selectedUserId}
                        onChange={(event) =>
                          setSelectedUserId(event.target.value)
                        }
                        fullWidth
                        select
                      >
                        {availableFormUsers.map((currentUser) => (
                          <MenuItem
                            key={currentUser._id}
                            value={currentUser._id}
                          >
                            {currentUser.firstName} {currentUser.lastName}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        label={translate("memberRole")}
                        value={selectedRole}
                        onChange={(event) =>
                          setSelectedRole(
                            event.target.value as ProjectGroupMemberRoleType,
                          )
                        }
                        fullWidth
                        select
                      >
                        <MenuItem value={ProjectGroupMemberRole.MEMBER}>
                          {translate("member")}
                        </MenuItem>
                        <MenuItem value={ProjectGroupMemberRole.MANAGER}>
                          {translate("manager")}
                        </MenuItem>
                      </TextField>

                      <Button
                        variant="contained"
                        onClick={handleAddFormMember}
                        disabled={!selectedUserId}
                      >
                        {translate("add")}
                      </Button>
                    </Box>

                    {formMembers.length === 0 ? (
                      <Typography color="text.secondary">
                        {translate("noMembers")}
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {formMembers.map((member) => (
                          <Stack
                            key={member.userId}
                            direction="row"
                            spacing={1}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography>
                              {getUserName(member.userId)}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={translate(member.role)}
                                size="small"
                                color={getMemberRoleColor(member.role)}
                              />

                              <IconButton
                                color="error"
                                size="small"
                                onClick={() =>
                                  handleRemoveFormMember(member.userId)
                                }
                              >
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              )}
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
        open={Boolean(groupToManage)}
        onClose={handleCloseManageMembers}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{translate("manageMembers")}</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 180px auto",
                },
                gap: 1.5,
              }}
            >
              <TextField
                label={translate("selectUser")}
                value={memberUserId}
                onChange={(event) => setMemberUserId(event.target.value)}
                fullWidth
                select
              >
                {availableMemberUsers.map((currentUser) => (
                  <MenuItem key={currentUser._id} value={currentUser._id}>
                    {currentUser.firstName} {currentUser.lastName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={translate("memberRole")}
                value={memberRole}
                onChange={(event) =>
                  setMemberRole(
                    event.target.value as ProjectGroupMemberRoleType,
                  )
                }
                fullWidth
                select
              >
                <MenuItem value={ProjectGroupMemberRole.MEMBER}>
                  {translate("member")}
                </MenuItem>
                <MenuItem value={ProjectGroupMemberRole.MANAGER}>
                  {translate("manager")}
                </MenuItem>
              </TextField>

              <Button
                variant="contained"
                onClick={handleAddExistingMember}
                disabled={!memberUserId || isAddingMember}
              >
                {translate("addMember")}
              </Button>
            </Box>

            <Card variant="outlined">
              <Stack>
                {groupToManage?.members.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      {translate("noMembers")}
                    </Typography>
                  </Box>
                ) : (
                  groupToManage?.members.map((member) => {
                    const isCreator =
                      member.user._id === groupToManage.createdBy?._id;

                    return (
                      <Box
                        key={member.user._id}
                        sx={{
                          p: 2,
                          borderBottom: `1px solid ${alpha(
                            theme.palette.divider,
                            0.8,
                          )}`,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                              {member.user.firstName} {member.user.lastName}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {member.user.email}
                            </Typography>
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            {isCreator && (
                              <Chip
                                label={translate("creator")}
                                size="small"
                                color="secondary"
                              />
                            )}

                            <Chip
                              label={translate(member.role)}
                              size="small"
                              color={getMemberRoleColor(member.role)}
                              sx={{ fontWeight: 800 }}
                            />

                            <IconButton
                              color="error"
                              disabled={isCreator || isRemovingMember}
                              onClick={() =>
                                handleRemoveExistingMember(member.user._id)
                              }
                            >
                              <PersonRemoveRoundedIcon />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </Card>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseManageMembers}>
            {translate("close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(groupToDelete)}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{translate("deleteGroup")}</DialogTitle>

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
