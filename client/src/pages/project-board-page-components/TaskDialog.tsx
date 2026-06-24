import type { ChangeEvent, FormEvent } from 'react';
import type { Dayjs } from 'dayjs';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import type { User } from '../../features/auth/types';
import type { Task, TaskComment } from '../../features/tasks/types';
import { useTranslate } from '../../hooks/useTranslate';
import type { TaskFormData } from './project-board.types';
import { getUserDisplayName } from './project-board.utils';
import TaskCommentsCard from './TaskCommentsCard';
import TaskFormCard from './TaskFormCard';
import TaskAttachmentsCard from './TaskAttachmentsCard';

type TaskDialogProps = {
    open: boolean;
    selectedTask: Task | null;
    projectName?: string;
    taskError: string;
    taskForm: TaskFormData;
    assignableUsers: User[];
    currentUserId?: string;
    canManageTasks: boolean;
    canUpdateStatus: boolean;
    isSubmittingTask: boolean;
    isDeletingTask: boolean;
    comments: TaskComment[];
    commentContent: string;
    editingCommentId: string;
    editingCommentContent: string;
    isCommentsFetching: boolean;
    isCreatingComment: boolean;
    isUpdatingComment: boolean;
    isDeletingComment: boolean;
    canEditComment: (comment: TaskComment) => boolean;
    canDeleteComment: (comment: TaskComment) => boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onDeleteTask: () => void;
    onTaskFormChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onTaskDueDateChange: (value: Dayjs | null) => void;
    onCommentContentChange: (value: string) => void;
    onAddComment: () => void;
    onStartEditComment: (comment: TaskComment) => void;
    onCancelEditComment: () => void;
    onEditingCommentContentChange: (value: string) => void;
    onSaveComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
};

export default function TaskDialog({
    open,
    selectedTask,
    projectName,
    taskError,
    taskForm,
    assignableUsers,
    currentUserId,
    canManageTasks,
    canUpdateStatus,
    isSubmittingTask,
    isDeletingTask,
    comments,
    commentContent,
    editingCommentId,
    editingCommentContent,
    isCommentsFetching,
    isCreatingComment,
    isUpdatingComment,
    isDeletingComment,
    canEditComment,
    canDeleteComment,
    onClose,
    onSubmit,
    onDeleteTask,
    onTaskFormChange,
    onTaskDueDateChange,
    onCommentContentChange,
    onAddComment,
    onStartEditComment,
    onCancelEditComment,
    onEditingCommentContentChange,
    onSaveComment,
    onDeleteComment
}: TaskDialogProps) {
    const translate = useTranslate();

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <Box component="form" onSubmit={onSubmit}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack spacing={0.5}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            {selectedTask ? translate('taskDetails') : translate('createTask')}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {projectName || translate('notAvailable')}
                        </Typography>

                        {selectedTask && (
                            <Typography variant="body2" color="text.secondary">
                                {translate('createdBy')}:{' '}
                                {getUserDisplayName(
                                    selectedTask.createdBy,
                                    currentUserId,
                                    translate('me')
                                )}
                            </Typography>
                        )}
                    </Stack>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {taskError && <Alert severity="error">{taskError}</Alert>}

                        <TaskFormCard
                            selectedTask={selectedTask}
                            taskForm={taskForm}
                            assignableUsers={assignableUsers}
                            currentUserId={currentUserId}
                            canManageTasks={canManageTasks}
                            canUpdateStatus={canUpdateStatus}
                            onChange={onTaskFormChange}
                            onDueDateChange={onTaskDueDateChange}
                        />

                        {selectedTask && (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        md: '1.1fr 0.9fr'
                                    },
                                    gap: 2
                                }}
                            >
                                <TaskCommentsCard
                                    comments={comments}
                                    commentContent={commentContent}
                                    editingCommentId={editingCommentId}
                                    editingCommentContent={editingCommentContent}
                                    currentUserId={currentUserId}
                                    isFetching={isCommentsFetching}
                                    isCreating={isCreatingComment}
                                    isUpdating={isUpdatingComment}
                                    isDeleting={isDeletingComment}
                                    canEditComment={canEditComment}
                                    canDeleteComment={canDeleteComment}
                                    onCommentContentChange={onCommentContentChange}
                                    onAddComment={onAddComment}
                                    onStartEditComment={onStartEditComment}
                                    onCancelEditComment={onCancelEditComment}
                                    onEditingCommentContentChange={onEditingCommentContentChange}
                                    onSaveComment={onSaveComment}
                                    onDeleteComment={onDeleteComment}
                                />

                                <TaskAttachmentsCard
                                    taskId={selectedTask._id}
                                    currentUserId={currentUserId}
                                    canManageAttachments={canManageTasks}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    {selectedTask && canManageTasks && (
                        <Button
                            type="button"
                            color="error"
                            startIcon={<DeleteRoundedIcon />}
                            onClick={onDeleteTask}
                            disabled={isDeletingTask}
                        >
                            {translate('delete')}
                        </Button>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Button type="button" onClick={onClose} disabled={isSubmittingTask}>
                        {translate('cancel')}
                    </Button>

                    {(!selectedTask || canManageTasks || canUpdateStatus) && (
                        <Button type="submit" variant="contained" disabled={isSubmittingTask}>
                            {selectedTask ? translate('save') : translate('create')}
                        </Button>
                    )}
                </DialogActions>
            </Box>
        </Dialog>
    );
}