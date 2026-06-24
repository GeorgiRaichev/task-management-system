import type { DragEvent } from 'react';
import { Box, Button, Card, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { Task, TaskStatus as TaskStatusType } from '../../features/tasks/types';
import type { TranslationKey } from '../../i18n/translations';
import { useTranslate } from '../../hooks/useTranslate';
import TaskCard from './TaskCard';

type TaskColumnProps = {
    status: TaskStatusType;
    label: TranslationKey;
    tasks: Task[];
    currentUserId?: string;
    canManageTasks: boolean;
    canUpdateTaskStatus: (task: Task) => boolean;
    onCreateTask: (status: TaskStatusType) => void;
    onOpenTask: (task: Task) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, task: Task) => void;
    onDrop: (event: DragEvent<HTMLDivElement>, status: TaskStatusType) => void;
};

export default function TaskColumn({
    status,
    label,
    tasks,
    currentUserId,
    canManageTasks,
    canUpdateTaskStatus,
    onCreateTask,
    onOpenTask,
    onDragStart,
    onDrop
}: TaskColumnProps) {
    const theme = useTheme();
    const translate = useTranslate();

    return (
        <Card
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, status)}
            sx={{
                p: 2,
                minHeight: 520,
                bgcolor: alpha(theme.palette.primary.main, 0.035)
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography sx={{ fontWeight: 900 }}>
                        {translate(label)}
                    </Typography>

                    <Chip label={tasks.length} size="small" sx={{ fontWeight: 900 }} />
                </Stack>

                {canManageTasks && (
                    <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => onCreateTask(status)}
                    >
                        {translate('add')}
                    </Button>
                )}

                {tasks.length === 0 ? (
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            textAlign: 'center',
                            border: `1px dashed ${alpha(theme.palette.text.secondary, 0.3)}`
                        }}
                    >
                        <Typography color="text.secondary">
                            {translate('noTasks')}
                        </Typography>
                    </Box>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            currentUserId={currentUserId}
                            draggable={canUpdateTaskStatus(task)}
                            onOpen={onOpenTask}
                            onDragStart={onDragStart}
                        />
                    ))
                )}
            </Stack>
        </Card>
    );
}