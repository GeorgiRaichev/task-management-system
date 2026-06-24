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
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { useAppSelector } from "../app/hooks";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "../features/projects/projectsApi";
import {
  ProjectStatus,
  type CreateProjectRequest,
  type Project,
} from "../features/projects/types";
import { useTranslate } from "../hooks/useTranslate";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDate } from "../utils/date";
import {
  canCreateProject,
  canDeleteProject,
  canEditProject,
} from "../utils/permissions";

const initialFormData: CreateProjectRequest = {
  name: "",
  description: "",
  deadline: "",
  status: ProjectStatus.PLANNED,
};

const getStatusColor = (status: ProjectStatus): ChipProps["color"] => {
  if (status === ProjectStatus.ACTIVE) {
    return "success";
  }

  if (status === ProjectStatus.COMPLETED) {
    return "primary";
  }

  if (status === ProjectStatus.ARCHIVED) {
    return "default";
  }

  return "warning";
};

export default function ProjectsPage() {
  const theme = useTheme();
  const translate = useTranslate();
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, isFetching } = useGetProjectsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [formData, setFormData] =
    useState<CreateProjectRequest>(initialFormData);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");

  const projects = data?.projects || [];
  const isEditMode = Boolean(selectedProject);
  const isSubmitting = isCreating || isUpdating;
  const hasAnyProjectActions = projects.some(
    (project) =>
      canEditProject(project, user) || canDeleteProject(project, user),
  );

  const pageTitle = useMemo(() => {
    if (isEditMode) {
      return translate("editProject");
    }

    return translate("createProject");
  }, [isEditMode, translate]);

  const handleOpenCreate = () => {
    setSelectedProject(null);
    setFormData(initialFormData);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      deadline: project.deadline ? project.deadline.split("T")[0] : "",
      status: project.status,
    });
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (project: Project) => {
    setError("");
    setProjectToDelete(project);
  };

  const handleCloseForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setSelectedProject(null);
    setFormData(initialFormData);
    setError("");
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setProjectToDelete(null);
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

  const handleDeadlineChange = (value: Dayjs | null) => {
    setFormData((prev) => ({
      ...prev,
      deadline: value ? value.format("YYYY-MM-DD") : "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const projectPayload: CreateProjectRequest = {
      ...formData,
      deadline: new Date(formData.deadline).toISOString(),
    };

    try {
      if (selectedProject) {
        await updateProject({
          projectId: selectedProject._id,
          data: projectPayload,
        }).unwrap();
      } else {
        await createProject(projectPayload).unwrap();
      }

      handleCloseForm();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) {
      return;
    }

    try {
      await deleteProject(projectToDelete._id).unwrap();
      setProjectToDelete(null);
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
          background: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)",
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
              <FolderRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h4">{translate("projects")}</Typography>
              <Typography sx={{ opacity: 0.78 }}>
                {projects.length} {translate("projects").toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          {canCreateProject(user) && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: "common.white",
                color: "primary.main",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.9),
                },
              }}
            >
              {translate("createProject")}
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        {isLoading || isFetching ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6">{translate("noData")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {translate("createProject")}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <TableCell>{translate("projectName")}</TableCell>
                  <TableCell>{translate("status")}</TableCell>
                  <TableCell>{translate("deadline")}</TableCell>
                  <TableCell>{translate("owner")}</TableCell>
                  <TableCell>{translate("createdAt")}</TableCell>
                  {hasAnyProjectActions && (
                    <TableCell align="right">{translate("actions")}</TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {projects.map((project) => {
                  const showEdit = canEditProject(project, user);
                  const showDelete = canDeleteProject(project, user);

                  return (
                    <TableRow key={project._id} hover>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 800 }}>
                            {project.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              maxWidth: 460,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.description || translate("notAvailable")}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={translate(project.status)}
                          color={getStatusColor(project.status)}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          project.deadline,
                          translate("notAvailable"),
                        )}
                      </TableCell>

                      <TableCell>
                        {project.createdBy
                          ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                          : translate("notAvailable")}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          project.createdAt,
                          translate("notAvailable"),
                        )}
                      </TableCell>

                      {hasAnyProjectActions && (
                        <TableCell align="right">
                          {showEdit && (
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEdit(project)}
                            >
                              <EditRoundedIcon />
                            </IconButton>
                          )}

                          {showDelete && (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDelete(project)}
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
                label={translate("projectName")}
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                name="description"
                label={translate("description")}
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                minRows={4}
              />

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={translate("deadline")}
                  value={formData.deadline ? dayjs(formData.deadline) : null}
                  onChange={handleDeadlineChange}
                  format="DD/MM/YYYY"
                  disablePast
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>

              <TextField
                name="status"
                label={translate("status")}
                value={formData.status}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value={ProjectStatus.PLANNED}>
                  {translate("planned")}
                </MenuItem>
                <MenuItem value={ProjectStatus.ACTIVE}>
                  {translate("active")}
                </MenuItem>
                <MenuItem value={ProjectStatus.COMPLETED}>
                  {translate("completed")}
                </MenuItem>
                <MenuItem value={ProjectStatus.ARCHIVED}>
                  {translate("archived")}
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
        open={Boolean(projectToDelete)}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{translate("deleteProject")}</DialogTitle>

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
