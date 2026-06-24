import {
  useMemo,
  useState,
  type DragEvent,
  type ChangeEvent,
  type FormEvent,
} from "react";
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
  TextField,
  Typography,
  alpha,
  useTheme,
  type ChipProps,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { UserRole, type User } from "../features/auth/types";
import { ProjectGroupMemberRole } from "../features/groups/types";
import { useGetGroupsQuery } from "../features/groups/groupsApi";
import { useGetProjectQuery } from "../features/projects/projectsApi";
import {
  TaskPriority,
  TaskStatus,
  type CreateTaskRequest,
  type Task,
  type TaskComment,
  type TaskPriority as TaskPriorityType,
  type TaskStatus as TaskStatusType,
} from "../features/tasks/types";
import {
  useCreateTaskCommentMutation,
  useCreateTaskMutation,
  useDeleteTaskCommentMutation,
  useDeleteTaskMutation,
  useGetProjectTasksQuery,
  useGetTaskCommentsQuery,
  useUpdateTaskCommentMutation,
  useUpdateTaskMutation,
} from "../features/tasks/tasksApi";
import { useTranslate } from "../hooks/useTranslate";
import type { TranslationKey } from "../i18n/translations";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDate, formatDateTime } from "../utils/date";

type TaskFormData = {
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriorityType;
  status: TaskStatusType;
  dueDate: string;
};

const columns: { status: TaskStatusType; label: TranslationKey }[] = [
  { status: TaskStatus.TODO, label: "todo" },
  { status: TaskStatus.IN_PROGRESS, label: "inProgress" },
  { status: TaskStatus.REVIEW, label: "review" },
  { status: TaskStatus.DONE, label: "done" },
];

const priorityLabels: Record<TaskPriorityType, TranslationKey> = {
  [TaskPriority.LOW]: "low",
  [TaskPriority.MEDIUM]: "medium",
  [TaskPriority.HIGH]: "high",
};

const initialTaskForm: TaskFormData = {
  title: "",
  description: "",
  assignedTo: "",
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.TODO,
  dueDate: "",
};

const getPriorityColor = (priority: TaskPriorityType): ChipProps["color"] => {
  if (priority === TaskPriority.HIGH) {
    return "error";
  }

  if (priority === TaskPriority.MEDIUM) {
    return "warning";
  }

  return "success";
};

const taskToForm = (task: Task): TaskFormData => ({
  title: task.title,
  description: task.description,
  assignedTo: task.assignedTo?._id || "",
  priority: task.priority,
  status: task.status,
  dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
});

const getUserDisplayName = (
  targetUser:
    | { _id: string; firstName: string; lastName: string }
    | null
    | undefined,
  currentUserId: string | undefined,
  meLabel: string,
) => {
  if (!targetUser) {
    return "N/A";
  }

  if (targetUser._id === currentUserId) {
    return meLabel;
  }

  return `${targetUser.firstName} ${targetUser.lastName}`;
};

export default function ProjectBoardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const translate = useTranslate();
  const { projectId = "" } = useParams();
  const { user } = useAppSelector((state) => state.auth);

  const { data: projectData, isLoading: isProjectLoading } = useGetProjectQuery(
    projectId,
    {
      skip: !projectId,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: groupsData, isLoading: isGroupsLoading } = useGetGroupsQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const projectGroups = useMemo(() => {
    return (
      groupsData?.groups.filter((group) => group.project?._id === projectId) ||
      []
    );
  }, [groupsData?.groups, projectId]);

  const projectHasGroup = projectGroups.length > 0;

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
  } = useGetProjectTasksQuery(projectId, {
    skip: !projectId || isGroupsLoading || !projectHasGroup,
    refetchOnMountOrArgChange: true,
  });

  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [createTaskComment, { isLoading: isCreatingComment }] =
    useCreateTaskCommentMutation();
  const [updateTaskComment, { isLoading: isUpdatingComment }] =
    useUpdateTaskCommentMutation();
  const [deleteTaskComment, { isLoading: isDeletingComment }] =
    useDeleteTaskCommentMutation();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(initialTaskForm);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentContent, setEditingCommentContent] = useState("");

  const { data: commentsData, isFetching: isCommentsFetching } =
    useGetTaskCommentsQuery(selectedTask?._id || "", {
      skip: !selectedTask,
      refetchOnMountOrArgChange: true,
    });

  const project = projectData?.project;
  const tasks = tasksData?.tasks || [];
  const comments = commentsData?.comments || [];
  const isLoading =
    isProjectLoading || isGroupsLoading || isTasksLoading || isTasksFetching;
  const isSubmittingTask = isCreatingTask || isUpdatingTask;

  const assignableUsers = useMemo(() => {
    const usersMap = new Map<string, User>();

    projectGroups.forEach((group) => {
      group.members.forEach((member) => {
        usersMap.set(member.user._id, member.user);
      });
    });

    return Array.from(usersMap.values());
  }, [projectGroups]);

  const isProjectManager = useMemo(() => {
    return projectGroups.some((group) =>
      group.members.some(
        (member) =>
          member.user._id === user?._id &&
          member.role === ProjectGroupMemberRole.MANAGER,
      ),
    );
  }, [projectGroups, user?._id]);

  const canManageTasks = Boolean(
    projectHasGroup &&
      user &&
      project &&
      (user.role === UserRole.ADMINISTRATOR ||
        project.createdBy?._id === user._id ||
        isProjectManager),
  );

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<TaskStatusType, Task[]>>(
      (acc, column) => {
        acc[column.status] = tasks.filter(
          (task) => task.status === column.status,
        );
        return acc;
      },
      {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.REVIEW]: [],
        [TaskStatus.DONE]: [],
      },
    );
  }, [tasks]);

  const canUpdateTaskStatus = (task: Task) => {
    return canManageTasks || task.assignedTo?._id === user?._id;
  };

  const canEditComment = (comment: TaskComment) => {
    return comment.author._id === user?._id;
  };

  const canDeleteComment = (comment: TaskComment) => {
    return (
      user?.role === UserRole.ADMINISTRATOR || comment.author._id === user?._id
    );
  };

  const handleOpenCreateTask = (status: TaskStatusType = TaskStatus.TODO) => {
    setSelectedTask(null);
    setTaskForm({
      ...initialTaskForm,
      status,
    });
    setTaskError("");
    setCommentContent("");
    setEditingCommentId("");
    setEditingCommentContent("");
    setIsTaskDialogOpen(true);
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setTaskForm(taskToForm(task));
    setTaskError("");
    setCommentContent("");
    setEditingCommentId("");
    setEditingCommentContent("");
    setIsTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    if (isSubmittingTask || isDeletingTask) {
      return;
    }

    setSelectedTask(null);
    setTaskForm(initialTaskForm);
    setTaskError("");
    setCommentContent("");
    setEditingCommentId("");
    setEditingCommentContent("");
    setIsTaskDialogOpen(false);
  };

  const handleTaskFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTaskDueDateChange = (value: Dayjs | null) => {
    setTaskForm((prev) => ({
      ...prev,
      dueDate: value ? value.format("YYYY-MM-DD") : "",
    }));
  };

  const handleSubmitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaskError("");

    const payload: Omit<CreateTaskRequest, "projectId"> = {
      title: taskForm.title,
      description: taskForm.description,
      assignedTo: taskForm.assignedTo || null,
      priority: taskForm.priority,
      status: taskForm.status,
      dueDate: new Date(taskForm.dueDate).toISOString(),
    };

    try {
      if (selectedTask) {
        const result = await updateTask({
          taskId: selectedTask._id,
          data: payload,
        }).unwrap();

        setSelectedTask(result.task);
        setTaskForm(taskToForm(result.task));
      } else {
        await createTask({
          projectId,
          ...payload,
        }).unwrap();

        handleCloseTaskDialog();
      }
    } catch (errorResponse) {
      setTaskError(
        getApiErrorMessage(errorResponse, translate("operationFailed")),
      );
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) {
      return;
    }

    setTaskError("");

    try {
      await deleteTask(selectedTask._id).unwrap();
      handleCloseTaskDialog();
    } catch (errorResponse) {
      setTaskError(
        getApiErrorMessage(errorResponse, translate("operationFailed")),
      );
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, task: Task) => {
    event.dataTransfer.setData("taskId", task._id);
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    status: TaskStatusType,
  ) => {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("taskId");
    const targetTask = tasks.find((task) => task._id === taskId);

    if (
      !targetTask ||
      targetTask.status === status ||
      !canUpdateTaskStatus(targetTask)
    ) {
      return;
    }

    try {
      await updateTask({
        taskId,
        data: {
          status,
        },
      }).unwrap();
    } catch {
      setTaskError(translate("operationFailed"));
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !commentContent.trim()) {
      return;
    }

    setTaskError("");

    try {
      await createTaskComment({
        taskId: selectedTask._id,
        content: commentContent.trim(),
      }).unwrap();

      setCommentContent("");
    } catch (errorResponse) {
      setTaskError(
        getApiErrorMessage(errorResponse, translate("operationFailed")),
      );
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
    setTaskError("");
  };

  const handleCancelEditComment = () => {
    setEditingCommentId("");
    setEditingCommentContent("");
    setTaskError("");
  };

  const handleSaveComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) {
      return;
    }

    setTaskError("");

    try {
      await updateTaskComment({
        commentId,
        content: editingCommentContent.trim(),
      }).unwrap();

      handleCancelEditComment();
    } catch (errorResponse) {
      setTaskError(
        getApiErrorMessage(errorResponse, translate("operationFailed")),
      );
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setTaskError("");

    try {
      await deleteTaskComment({
        commentId,
      }).unwrap();
    } catch (errorResponse) {
      setTaskError(
        getApiErrorMessage(errorResponse, translate("operationFailed")),
      );
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!projectHasGroup) {
    return (
      <Dialog
        open
        onClose={() => navigate("/projects")}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <WarningAmberRoundedIcon color="warning" />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {project?.name || translate("projectBoard")}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {translate("projectBoard")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {translate("projectNeedsGroup")}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" onClick={() => navigate("/projects")}>
            {translate("projects")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

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
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <IconButton
              onClick={() => navigate("/projects")}
              sx={{
                color: "common.white",
                bgcolor: alpha("#ffffff", 0.16),
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.24),
                },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box>
              <Typography variant="h4">
                {project?.name || translate("projectBoard")}
              </Typography>

              <Typography sx={{ opacity: 0.78 }}>
                {tasks.length} {translate("tasks").toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          {canManageTasks && (
            <Button
              type="button"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => handleOpenCreateTask()}
              sx={{
                bgcolor: "common.white",
                color: "primary.main",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.9),
                },
              }}
            >
              {translate("createTask")}
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {columns.map((column) => (
          <Card
            key={column.status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.status)}
            sx={{
              p: 2,
              minHeight: 520,
              bgcolor: alpha(theme.palette.primary.main, 0.035),
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>
                  {translate(column.label)}
                </Typography>

                <Chip
                  label={groupedTasks[column.status].length}
                  size="small"
                  sx={{ fontWeight: 900 }}
                />
              </Stack>

              {canManageTasks && (
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => handleOpenCreateTask(column.status)}
                >
                  {translate("add")}
                </Button>
              )}

              {groupedTasks[column.status].length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    textAlign: "center",
                    border: `1px dashed ${alpha(theme.palette.text.secondary, 0.3)}`,
                  }}
                >
                  <Typography color="text.secondary">
                    {translate("noTasks")}
                  </Typography>
                </Box>
              ) : (
                groupedTasks[column.status].map((task) => (
                  <Card
                    key={task._id}
                    draggable={canUpdateTaskStatus(task)}
                    onDragStart={(event) => handleDragStart(event, task)}
                    onClick={() => handleOpenTask(task)}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                      transition: "0.18s ease",
                    }}
                  >
                    <Stack spacing={1.2}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <AssignmentRoundedIcon
                          color="primary"
                          fontSize="small"
                        />

                        <Typography sx={{ fontWeight: 900 }}>
                          {task.title}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {task.description}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap" }}
                      >
                        <Chip
                          label={translate(priorityLabels[task.priority])}
                          color={getPriorityColor(task.priority)}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />

                        <Chip
                          label={
                            task.assignedTo
                              ? getUserDisplayName(
                                  task.assignedTo,
                                  user?._id,
                                  translate("me"),
                                )
                              : translate("unassigned")
                          }
                          size="small"
                        />
                      </Stack>

                      <Stack spacing={0.4}>
                        <Typography variant="caption" color="text.secondary">
                          {translate("createdBy")}:{" "}
                          {getUserDisplayName(
                            task.createdBy,
                            user?._id,
                            translate("me"),
                          )}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {translate("dueDate")}: {formatDate(task.dueDate)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        ))}
      </Box>

      <Dialog
        open={isTaskDialogOpen}
        onClose={handleCloseTaskDialog}
        fullWidth
        maxWidth="md"
      >
        <Box component="form" onSubmit={handleSubmitTask}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {selectedTask
                  ? translate("taskDetails")
                  : translate("createTask")}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {project?.name || translate("notAvailable")}
              </Typography>

              {selectedTask && (
                <Typography variant="body2" color="text.secondary">
                  {translate("createdBy")}:{" "}
                  {getUserDisplayName(
                    selectedTask.createdBy,
                    user?._id,
                    translate("me"),
                  )}
                </Typography>
              )}
            </Stack>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {taskError && <Alert severity="error">{taskError}</Alert>}

              <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack spacing={2.5}>
                  <TextField
                    name="title"
                    label={translate("taskTitle")}
                    value={taskForm.title}
                    onChange={handleTaskFormChange}
                    fullWidth
                    required
                    disabled={Boolean(selectedTask) && !canManageTasks}
                  />

                  <TextField
                    name="description"
                    label={translate("description")}
                    value={taskForm.description}
                    onChange={handleTaskFormChange}
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    disabled={Boolean(selectedTask) && !canManageTasks}
                  />

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
                      name="assignedTo"
                      label={translate("assignedTo")}
                      value={taskForm.assignedTo}
                      onChange={handleTaskFormChange}
                      fullWidth
                      select
                      disabled={Boolean(selectedTask) && !canManageTasks}
                    >
                      <MenuItem value="">{translate("unassigned")}</MenuItem>

                      {assignableUsers.map((item) => (
                        <MenuItem key={item._id} value={item._id}>
                          {getUserDisplayName(item, user?._id, translate("me"))}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      name="priority"
                      label={translate("priority")}
                      value={taskForm.priority}
                      onChange={handleTaskFormChange}
                      fullWidth
                      select
                      disabled={Boolean(selectedTask) && !canManageTasks}
                    >
                      <MenuItem value={TaskPriority.LOW}>
                        {translate("low")}
                      </MenuItem>

                      <MenuItem value={TaskPriority.MEDIUM}>
                        {translate("medium")}
                      </MenuItem>

                      <MenuItem value={TaskPriority.HIGH}>
                        {translate("high")}
                      </MenuItem>
                    </TextField>

                    <TextField
                      name="status"
                      label={translate("status")}
                      value={taskForm.status}
                      onChange={handleTaskFormChange}
                      fullWidth
                      select
                      disabled={
                        Boolean(selectedTask) &&
                        selectedTask !== null &&
                        !canUpdateTaskStatus(selectedTask)
                      }
                    >
                      {columns.map((column) => (
                        <MenuItem key={column.status} value={column.status}>
                          {translate(column.label)}
                        </MenuItem>
                      ))}
                    </TextField>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={translate("dueDate")}
                        value={
                          taskForm.dueDate ? dayjs(taskForm.dueDate) : null
                        }
                        onChange={handleTaskDueDateChange}
                        format="DD/MM/YYYY"
                        disablePast
                        disabled={Boolean(selectedTask) && !canManageTasks}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Stack>
              </Card>

              {selectedTask && (
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Typography sx={{ fontWeight: 900 }}>
                      {translate("comments")}
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr auto",
                        },
                        gap: 1.5,
                        alignItems: "stretch",
                      }}
                    >
                      <TextField
                        value={commentContent}
                        onChange={(event) =>
                          setCommentContent(event.target.value)
                        }
                        label={translate("comment")}
                        fullWidth
                        multiline
                        minRows={2}
                      />

                      <Button
                        type="button"
                        variant="contained"
                        onClick={handleAddComment}
                        disabled={!commentContent.trim() || isCreatingComment}
                        sx={{
                          minWidth: 58,
                          px: 2,
                          borderRadius: 2,
                          alignSelf: "stretch",
                        }}
                      >
                        <SendRoundedIcon />
                      </Button>
                    </Box>

                    {isCommentsFetching ? (
                      <Box sx={{ p: 2, display: "grid", placeItems: "center" }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : comments.length === 0 ? (
                      <Typography color="text.secondary">
                        {translate("noData")}
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {comments.map((comment) => {
                          const isEditing = editingCommentId === comment._id;

                          return (
                            <Box
                              key={comment._id}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.04,
                                ),
                              }}
                            >
                              <Stack spacing={1}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Box>
                                    <Typography sx={{ fontWeight: 900 }}>
                                      {getUserDisplayName(
                                        comment.author,
                                        user?._id,
                                        translate("me"),
                                      )}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatDateTime(comment.createdAt)}
                                    </Typography>
                                  </Box>

                                  <Stack direction="row" spacing={0.5}>
                                    {canEditComment(comment) && !isEditing && (
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() =>
                                          handleStartEditComment(comment)
                                        }
                                      >
                                        <EditRoundedIcon fontSize="small" />
                                      </IconButton>
                                    )}

                                    {canDeleteComment(comment) && (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        disabled={isDeletingComment}
                                        onClick={() =>
                                          handleDeleteComment(comment._id)
                                        }
                                      >
                                        <DeleteRoundedIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Stack>
                                </Stack>

                                {isEditing ? (
                                  <Stack spacing={1}>
                                    <TextField
                                      value={editingCommentContent}
                                      onChange={(event) =>
                                        setEditingCommentContent(
                                          event.target.value,
                                        )
                                      }
                                      fullWidth
                                      multiline
                                      minRows={2}
                                    />

                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        type="button"
                                        variant="contained"
                                        size="small"
                                        startIcon={<SaveRoundedIcon />}
                                        disabled={
                                          isUpdatingComment ||
                                          !editingCommentContent.trim()
                                        }
                                        onClick={() =>
                                          handleSaveComment(comment._id)
                                        }
                                      >
                                        {translate("save")}
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="outlined"
                                        size="small"
                                        startIcon={<CloseRoundedIcon />}
                                        onClick={handleCancelEditComment}
                                      >
                                        {translate("cancel")}
                                      </Button>
                                    </Stack>
                                  </Stack>
                                ) : (
                                  <Typography>{comment.content}</Typography>
                                )}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            {selectedTask && canManageTasks && (
              <Button
                type="button"
                color="error"
                startIcon={<DeleteRoundedIcon />}
                onClick={handleDeleteTask}
                disabled={isDeletingTask}
              >
                {translate("delete")}
              </Button>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Button
              type="button"
              onClick={handleCloseTaskDialog}
              disabled={isSubmittingTask}
            >
              {translate("cancel")}
            </Button>

            {(!selectedTask ||
              canManageTasks ||
              canUpdateTaskStatus(selectedTask)) && (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmittingTask}
              >
                {selectedTask ? translate("save") : translate("create")}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}