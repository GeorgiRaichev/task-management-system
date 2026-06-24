import {
    useMemo,
    useState,
    type ChangeEvent,
    type DragEvent,
    type FormEvent
} from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import type { Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '../app/hooks';
import { UserRole, type User } from '../features/auth/types';
import { useGetGroupsQuery } from '../features/groups/groupsApi';
import { ProjectGroupMemberRole } from '../features/groups/types';
import { useGetProjectQuery } from '../features/projects/projectsApi';
import {
    TaskStatus,
    type CreateTaskRequest,
    type Task,
    type TaskComment,
    type TaskStatus as TaskStatusType
} from '../features/tasks/types';
import {
    useCreateTaskCommentMutation,
    useCreateTaskMutation,
    useDeleteTaskCommentMutation,
    useDeleteTaskMutation,
    useGetProjectTasksQuery,
    useGetTaskCommentsQuery,
    useUpdateTaskCommentMutation,
    useUpdateTaskMutation
} from '../features/tasks/tasksApi';
import { useTranslate } from '../hooks/useTranslate';
import { getApiErrorMessage } from '../utils/api-error';
import ProjectBoardHeader from './project-board-page-components/ProjectBoardHeader';
import ProjectNeedsGroupDialog from './project-board-page-components/ProjectNeedsGroupDialog';
import TaskColumn from './project-board-page-components/TaskColumn';
import TaskDialog from './project-board-page-components/TaskDialog';
import {
    columns,
    initialTaskForm
} from './project-board-page-components/project-board.constants';
import type { TaskFormData } from './project-board-page-components/project-board.types';
import { taskToForm } from './project-board-page-components/project-board.utils';

export default function ProjectBoardPage() {
    const navigate = useNavigate();
    const translate = useTranslate();
    const { projectId = '' } = useParams();
    const { user } = useAppSelector((state) => state.auth);

    const { data: projectData, isLoading: isProjectLoading } = useGetProjectQuery(
        projectId,
        {
            skip: !projectId,
            refetchOnMountOrArgChange: true
        }
    );

    const { data: groupsData, isLoading: isGroupsLoading } = useGetGroupsQuery(
        undefined,
        {
            refetchOnMountOrArgChange: true
        }
    );

    const projectGroups = useMemo(() => {
        return groupsData?.groups.filter((group) => group.project?._id === projectId) || [];
    }, [groupsData?.groups, projectId]);

    const projectHasGroup = projectGroups.length > 0;

    const {
        data: tasksData,
        isLoading: isTasksLoading,
        isFetching: isTasksFetching
    } = useGetProjectTasksQuery(projectId, {
        skip: !projectId || isGroupsLoading || !projectHasGroup,
        refetchOnMountOrArgChange: true
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
    const [taskError, setTaskError] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState('');
    const [editingCommentContent, setEditingCommentContent] = useState('');

    const { data: commentsData, isFetching: isCommentsFetching } =
        useGetTaskCommentsQuery(selectedTask?._id || '', {
            skip: !selectedTask,
            refetchOnMountOrArgChange: true
        });

    const project = projectData?.project;

    const tasks = useMemo(() => {
        return tasksData?.tasks || [];
    }, [tasksData?.tasks]);

    const comments = useMemo(() => {
        return commentsData?.comments || [];
    }, [commentsData?.comments]);

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
                    member.role === ProjectGroupMemberRole.MANAGER
            )
        );
    }, [projectGroups, user?._id]);

    const canManageTasks = Boolean(
        projectHasGroup &&
            user &&
            project &&
            (user.role === UserRole.ADMINISTRATOR ||
                project.createdBy?._id === user._id ||
                isProjectManager)
    );

    const groupedTasks = useMemo(() => {
        return columns.reduce<Record<TaskStatusType, Task[]>>(
            (acc, column) => {
                acc[column.status] = tasks.filter((task) => task.status === column.status);
                return acc;
            },
            {
                [TaskStatus.TODO]: [],
                [TaskStatus.IN_PROGRESS]: [],
                [TaskStatus.REVIEW]: [],
                [TaskStatus.DONE]: []
            }
        );
    }, [tasks]);

    const canUpdateTaskStatus = (task: Task) => {
        return canManageTasks || task.assignedTo?._id === user?._id;
    };

    const canEditComment = (comment: TaskComment) => {
        return comment.author._id === user?._id;
    };

    const canDeleteComment = (comment: TaskComment) => {
        return user?.role === UserRole.ADMINISTRATOR || comment.author._id === user?._id;
    };

    const resetCommentState = () => {
        setCommentContent('');
        setEditingCommentId('');
        setEditingCommentContent('');
    };

    const handleGoBack = () => {
        navigate('/projects');
    };

    const handleOpenCreateTask = (status: TaskStatusType = TaskStatus.TODO) => {
        setSelectedTask(null);
        setTaskForm({
            ...initialTaskForm,
            status
        });
        setTaskError('');
        resetCommentState();
        setIsTaskDialogOpen(true);
    };

    const handleOpenTask = (task: Task) => {
        setSelectedTask(task);
        setTaskForm(taskToForm(task));
        setTaskError('');
        resetCommentState();
        setIsTaskDialogOpen(true);
    };

    const handleCloseTaskDialog = () => {
        if (isSubmittingTask || isDeletingTask) {
            return;
        }

        setSelectedTask(null);
        setTaskForm(initialTaskForm);
        setTaskError('');
        resetCommentState();
        setIsTaskDialogOpen(false);
    };

    const handleTaskFormChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setTaskForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTaskDueDateChange = (value: Dayjs | null) => {
        setTaskForm((prev) => ({
            ...prev,
            dueDate: value ? value.format('YYYY-MM-DD') : ''
        }));
    };

    const handleSubmitTask = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTaskError('');

        const payload: Omit<CreateTaskRequest, 'projectId'> = {
            title: taskForm.title,
            description: taskForm.description,
            assignedTo: taskForm.assignedTo || null,
            priority: taskForm.priority,
            status: taskForm.status,
            dueDate: new Date(taskForm.dueDate).toISOString()
        };

        try {
            if (selectedTask) {
                const result = await updateTask({
                    taskId: selectedTask._id,
                    data: payload
                }).unwrap();

                setSelectedTask(result.task);
                setTaskForm(taskToForm(result.task));
            } else {
                await createTask({
                    projectId,
                    ...payload
                }).unwrap();

                handleCloseTaskDialog();
            }
        } catch (errorResponse) {
            setTaskError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) {
            return;
        }

        setTaskError('');

        try {
            await deleteTask(selectedTask._id).unwrap();
            handleCloseTaskDialog();
        } catch (errorResponse) {
            setTaskError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handleDragStart = (event: DragEvent<HTMLDivElement>, task: Task) => {
        event.dataTransfer.setData('taskId', task._id);
    };

    const handleDrop = async (
        event: DragEvent<HTMLDivElement>,
        status: TaskStatusType
    ) => {
        event.preventDefault();

        const taskId = event.dataTransfer.getData('taskId');
        const targetTask = tasks.find((task) => task._id === taskId);

        if (!targetTask || targetTask.status === status || !canUpdateTaskStatus(targetTask)) {
            return;
        }

        try {
            await updateTask({
                taskId,
                data: {
                    status
                }
            }).unwrap();
        } catch {
            setTaskError(translate('operationFailed'));
        }
    };

    const handleAddComment = async () => {
        if (!selectedTask || !commentContent.trim()) {
            return;
        }

        setTaskError('');

        try {
            await createTaskComment({
                taskId: selectedTask._id,
                content: commentContent.trim()
            }).unwrap();

            setCommentContent('');
        } catch (errorResponse) {
            setTaskError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handleStartEditComment = (comment: TaskComment) => {
        setEditingCommentId(comment._id);
        setEditingCommentContent(comment.content);
        setTaskError('');
    };

    const handleCancelEditComment = () => {
        setEditingCommentId('');
        setEditingCommentContent('');
        setTaskError('');
    };

    const handleSaveComment = async (commentId: string) => {
        if (!editingCommentContent.trim()) {
            return;
        }

        setTaskError('');

        try {
            await updateTaskComment({
                commentId,
                content: editingCommentContent.trim()
            }).unwrap();

            handleCancelEditComment();
        } catch (errorResponse) {
            setTaskError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        setTaskError('');

        try {
            await deleteTaskComment({
                commentId
            }).unwrap();
        } catch (errorResponse) {
            setTaskError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const selectedTaskCanUpdateStatus = selectedTask
        ? canUpdateTaskStatus(selectedTask)
        : canManageTasks;

    if (isLoading) {
        return (
            <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!projectHasGroup) {
        return (
            <ProjectNeedsGroupDialog
                projectName={project?.name}
                onBack={handleGoBack}
            />
        );
    }

    return (
        <Stack spacing={3}>
            <ProjectBoardHeader
                projectName={project?.name}
                tasksCount={tasks.length}
                canManageTasks={canManageTasks}
                onBack={handleGoBack}
                onCreateTask={() => handleOpenCreateTask()}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(4, minmax(0, 1fr))'
                    },
                    gap: 2
                }}
            >
                {columns.map((column) => (
                    <TaskColumn
                        key={column.status}
                        status={column.status}
                        label={column.label}
                        tasks={groupedTasks[column.status]}
                        currentUserId={user?._id}
                        canManageTasks={canManageTasks}
                        canUpdateTaskStatus={canUpdateTaskStatus}
                        onCreateTask={handleOpenCreateTask}
                        onOpenTask={handleOpenTask}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                    />
                ))}
            </Box>

            <TaskDialog
                open={isTaskDialogOpen}
                selectedTask={selectedTask}
                projectName={project?.name}
                taskError={taskError}
                taskForm={taskForm}
                assignableUsers={assignableUsers}
                currentUserId={user?._id}
                canManageTasks={canManageTasks}
                canUpdateStatus={selectedTaskCanUpdateStatus}
                isSubmittingTask={isSubmittingTask}
                isDeletingTask={isDeletingTask}
                comments={comments}
                commentContent={commentContent}
                editingCommentId={editingCommentId}
                editingCommentContent={editingCommentContent}
                isCommentsFetching={isCommentsFetching}
                isCreatingComment={isCreatingComment}
                isUpdatingComment={isUpdatingComment}
                isDeletingComment={isDeletingComment}
                canEditComment={canEditComment}
                canDeleteComment={canDeleteComment}
                onClose={handleCloseTaskDialog}
                onSubmit={handleSubmitTask}
                onDeleteTask={handleDeleteTask}
                onTaskFormChange={handleTaskFormChange}
                onTaskDueDateChange={handleTaskDueDateChange}
                onCommentContentChange={setCommentContent}
                onAddComment={handleAddComment}
                onStartEditComment={handleStartEditComment}
                onCancelEditComment={handleCancelEditComment}
                onEditingCommentContentChange={setEditingCommentContent}
                onSaveComment={handleSaveComment}
                onDeleteComment={handleDeleteComment}
            />
        </Stack>
    );
}