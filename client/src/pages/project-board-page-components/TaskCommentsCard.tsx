import {
    Box,
    Button,
    Card,
    CircularProgress,
    IconButton,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import type { TaskComment } from '../../features/tasks/types';
import { useTranslate } from '../../hooks/useTranslate';
import { formatDateTime } from '../../utils/date';
import { getUserDisplayName } from './project-board.utils';

type TaskCommentsCardProps = {
    comments: TaskComment[];
    commentContent: string;
    editingCommentId: string;
    editingCommentContent: string;
    currentUserId?: string;
    isFetching: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    canEditComment: (comment: TaskComment) => boolean;
    canDeleteComment: (comment: TaskComment) => boolean;
    onCommentContentChange: (value: string) => void;
    onAddComment: () => void;
    onStartEditComment: (comment: TaskComment) => void;
    onCancelEditComment: () => void;
    onEditingCommentContentChange: (value: string) => void;
    onSaveComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
};

export default function TaskCommentsCard({
    comments,
    commentContent,
    editingCommentId,
    editingCommentContent,
    currentUserId,
    isFetching,
    isCreating,
    isUpdating,
    isDeleting,
    canEditComment,
    canDeleteComment,
    onCommentContentChange,
    onAddComment,
    onStartEditComment,
    onCancelEditComment,
    onEditingCommentContentChange,
    onSaveComment,
    onDeleteComment
}: TaskCommentsCardProps) {
    const theme = useTheme();
    const translate = useTranslate();

    return (
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={2}>
                <Typography sx={{ fontWeight: 900 }}>
                    {translate('comments')}
                </Typography>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr auto'
                        },
                        gap: 1.5,
                        alignItems: 'stretch'
                    }}
                >
                    <TextField
                        value={commentContent}
                        onChange={(event) => onCommentContentChange(event.target.value)}
                        label={translate('comment')}
                        fullWidth
                        multiline
                        minRows={2}
                    />

                    <Button
                        type="button"
                        variant="contained"
                        onClick={onAddComment}
                        disabled={!commentContent.trim() || isCreating}
                        sx={{
                            minWidth: 58,
                            px: 2,
                            borderRadius: 2,
                            alignSelf: 'stretch'
                        }}
                    >
                        <SendRoundedIcon />
                    </Button>
                </Box>

                {isFetching ? (
                    <Box sx={{ p: 2, display: 'grid', placeItems: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : comments.length === 0 ? (
                    <Typography color="text.secondary">
                        {translate('noData')}
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
                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 900 }}>
                                                    {getUserDisplayName(
                                                        comment.author,
                                                        currentUserId,
                                                        translate('me')
                                                    )}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDateTime(comment.createdAt)}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={0.5}>
                                                {canEditComment(comment) && !isEditing && (
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => onStartEditComment(comment)}
                                                    >
                                                        <EditRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                )}

                                                {canDeleteComment(comment) && (
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={isDeleting}
                                                        onClick={() => onDeleteComment(comment._id)}
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
                                                        onEditingCommentContentChange(
                                                            event.target.value
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
                                                            isUpdating ||
                                                            !editingCommentContent.trim()
                                                        }
                                                        onClick={() => onSaveComment(comment._id)}
                                                    >
                                                        {translate('save')}
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<CloseRoundedIcon />}
                                                        onClick={onCancelEditComment}
                                                    >
                                                        {translate('cancel')}
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
    );
}