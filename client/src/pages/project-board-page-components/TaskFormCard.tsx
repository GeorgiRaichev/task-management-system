import type { ChangeEvent } from 'react';
import { Box, Card, MenuItem, Stack, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { User } from '../../features/auth/types';
import { TaskPriority, type Task } from '../../features/tasks/types';
import { useTranslate } from '../../hooks/useTranslate';
import { columns } from './project-board.constants';
import type { TaskFormData } from './project-board.types';
import { getUserDisplayName } from './project-board.utils';

type TaskFormCardProps = {
    selectedTask: Task | null;
    taskForm: TaskFormData;
    assignableUsers: User[];
    currentUserId?: string;
    canManageTasks: boolean;
    canUpdateStatus: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onDueDateChange: (value: Dayjs | null) => void;
};

export default function TaskFormCard({
    selectedTask,
    taskForm,
    assignableUsers,
    currentUserId,
    canManageTasks,
    canUpdateStatus,
    onChange,
    onDueDateChange
}: TaskFormCardProps) {
    const translate = useTranslate();

    const isEditMode = Boolean(selectedTask);
    const isTaskFieldsDisabled = isEditMode && !canManageTasks;
    const isStatusDisabled = isEditMode && !canUpdateStatus;

    return (
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={2.5}>
                <TextField
                    name="title"
                    label={translate('taskTitle')}
                    value={taskForm.title}
                    onChange={onChange}
                    fullWidth
                    required
                    disabled={isTaskFieldsDisabled}
                />

                <TextField
                    name="description"
                    label={translate('description')}
                    value={taskForm.description}
                    onChange={onChange}
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    disabled={isTaskFieldsDisabled}
                />

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr'
                        },
                        gap: 2
                    }}
                >
                    <TextField
                        name="assignedTo"
                        label={translate('assignedTo')}
                        value={taskForm.assignedTo}
                        onChange={onChange}
                        fullWidth
                        select
                        disabled={isTaskFieldsDisabled}
                    >
                        <MenuItem value="">{translate('unassigned')}</MenuItem>

                        {assignableUsers.map((item) => (
                            <MenuItem key={item._id} value={item._id}>
                                {getUserDisplayName(item, currentUserId, translate('me'))}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        name="priority"
                        label={translate('priority')}
                        value={taskForm.priority}
                        onChange={onChange}
                        fullWidth
                        select
                        disabled={isTaskFieldsDisabled}
                    >
                        <MenuItem value={TaskPriority.LOW}>
                            {translate('low')}
                        </MenuItem>

                        <MenuItem value={TaskPriority.MEDIUM}>
                            {translate('medium')}
                        </MenuItem>

                        <MenuItem value={TaskPriority.HIGH}>
                            {translate('high')}
                        </MenuItem>
                    </TextField>

                    <TextField
                        name="status"
                        label={translate('status')}
                        value={taskForm.status}
                        onChange={onChange}
                        fullWidth
                        select
                        disabled={isStatusDisabled}
                    >
                        {columns.map((column) => (
                            <MenuItem key={column.status} value={column.status}>
                                {translate(column.label)}
                            </MenuItem>
                        ))}
                    </TextField>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label={translate('dueDate')}
                            value={taskForm.dueDate ? dayjs(taskForm.dueDate) : null}
                            onChange={onDueDateChange}
                            format="DD/MM/YYYY"
                            disablePast
                            disabled={isTaskFieldsDisabled}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    required: true
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Box>
            </Stack>
        </Card>
    );
}