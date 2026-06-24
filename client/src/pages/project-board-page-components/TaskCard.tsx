import type { DragEvent } from 'react';
import { Card, Chip, Stack, Typography } from '@mui/material';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import type { Task } from '../../features/tasks/types';
import { useTranslate } from '../../hooks/useTranslate';
import { formatDate } from '../../utils/date';
import { priorityLabels } from './project-board.constants';
import { getPriorityColor, getUserDisplayName } from './project-board.utils';

type TaskCardProps = {
    task: Task;
    currentUserId?: string;
    draggable: boolean;
    onOpen: (task: Task) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, task: Task) => void;
};

export default function TaskCard({
    task,
    currentUserId,
    draggable,
    onOpen,
    onDragStart
}: TaskCardProps) {
    const translate = useTranslate();

    return (
        <Card
            draggable={draggable}
            onDragStart={(event) => onDragStart(event, task)}
            onClick={() => onOpen(task)}
            sx={{
                p: 2,
                cursor: 'pointer',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                '&:hover': {
                    transform: 'translateY(-2px)'
                },
                transition: '0.18s ease'
            }}
        >
            <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AssignmentRoundedIcon color="primary" fontSize="small" />

                    <Typography sx={{ fontWeight: 900 }}>
                        {task.title}
                    </Typography>
                </Stack>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {task.description}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip
                        label={translate(priorityLabels[task.priority])}
                        color={getPriorityColor(task.priority)}
                        size="small"
                        sx={{ fontWeight: 800 }}
                    />

                    <Chip
                        label={
                            task.assignedTo
                                ? getUserDisplayName(task.assignedTo, currentUserId, translate('me'))
                                : translate('unassigned')
                        }
                        size="small"
                    />
                </Stack>

                <Stack spacing={0.4}>
                    <Typography variant="caption" color="text.secondary">
                        {translate('createdBy')}:{' '}
                        {getUserDisplayName(task.createdBy, currentUserId, translate('me'))}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        {translate('dueDate')}: {formatDate(task.dueDate)}
                    </Typography>
                </Stack>
            </Stack>
        </Card>
    );
}