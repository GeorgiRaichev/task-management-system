import { type ChangeEvent, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useGetTaskAttachmentsQuery, useUploadTaskAttachmentMutation, useDeleteTaskAttachmentMutation } from '../../features/attachments/attachmentsApi';
import type { TaskAttachment } from '../../features/attachments/types';
import { useTranslate } from '../../hooks/useTranslate';
import { getApiErrorMessage } from '../../utils/api-error';



type TaskAttachmentsCardProps = {
    taskId: string;
    currentUserId?: string;
    canManageAttachments?: boolean;
};

const fileBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const getAttachmentName = (attachment: TaskAttachment, fallback: string) => {
    return attachment.originalName || attachment.fileName || fallback;
};

const getAttachmentUrl = (attachment: TaskAttachment) => {
    if (!attachment.fileUrl) {
        return '';
    }

    if (attachment.fileUrl.startsWith('http')) {
        return attachment.fileUrl;
    }

    return `${fileBaseUrl}${attachment.fileUrl.startsWith('/') ? attachment.fileUrl : `/${attachment.fileUrl}`}`;
};

const isImageAttachment = (attachment: TaskAttachment) => {
    const mimeType = attachment.mimeType || '';
    const name = getAttachmentName(attachment, '').toLowerCase();

    return (
        mimeType.startsWith('image/') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif')
    );
};

const formatFileSize = (size: number | undefined, fallback: string) => {
    if (!size) {
        return fallback;
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function TaskAttachmentsCard({
    taskId,
    currentUserId,
    canManageAttachments = false
}: TaskAttachmentsCardProps) {
    const theme = useTheme();
    const translate = useTranslate();

    const { data, isFetching } = useGetTaskAttachmentsQuery(taskId, {
        skip: !taskId,
        refetchOnMountOrArgChange: true
    });

    const [uploadTaskAttachment, { isLoading: isUploadingAttachment }] =
        useUploadTaskAttachmentMutation();
    const [deleteTaskAttachment, { isLoading: isDeletingAttachment }] =
        useDeleteTaskAttachmentMutation();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [inputKey, setInputKey] = useState(0);
    const [error, setError] = useState('');

    const attachments = data?.attachments || [];

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setError('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            return;
        }

        setError('');

        try {
            await uploadTaskAttachment({
                taskId,
                file: selectedFile
            }).unwrap();

            setSelectedFile(null);
            setInputKey((prev) => prev + 1);
        } catch (errorResponse) {
            setError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handleOpenAttachment = (attachment: TaskAttachment) => {
        const url = getAttachmentUrl(attachment);

        if (!url) {
            return;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        setError('');

        try {
            await deleteTaskAttachment(attachmentId).unwrap();
        } catch (errorResponse) {
            setError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const canDeleteAttachment = (attachment: TaskAttachment) => {
        return canManageAttachments || attachment.uploadedBy?._id === currentUserId;
    };

    return (
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AttachFileRoundedIcon color="primary" />

                    <Typography sx={{ fontWeight: 900 }}>
                        {translate('attachments')}
                    </Typography>

                    <Chip
                        label={attachments.length}
                        size="small"
                        sx={{
                            fontWeight: 900,
                            ml: 'auto'
                        }}
                    />
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}

                <Box
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`
                    }}
                >
                    <Stack spacing={1.5}>
                        <Button
                            type="button"
                            component="label"
                            variant="outlined"
                            startIcon={<AttachFileRoundedIcon />}
                            fullWidth
                        >
                            {translate('selectFile')}

                            <input
                                key={inputKey}
                                type="file"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>

                        {selectedFile && (
                            <Typography variant="body2" color="text.secondary">
                                {translate('selectedFile')}: {selectedFile.name}
                            </Typography>
                        )}

                        <Button
                            type="button"
                            variant="contained"
                            startIcon={<CloudUploadRoundedIcon />}
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploadingAttachment}
                            fullWidth
                        >
                            {translate('uploadAttachment')}
                        </Button>
                    </Stack>
                </Box>

                {isFetching ? (
                    <Box sx={{ p: 2, display: 'grid', placeItems: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : attachments.length === 0 ? (
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            textAlign: 'center',
                            border: `1px dashed ${alpha(theme.palette.text.secondary, 0.3)}`
                        }}
                    >
                        <Typography color="text.secondary">
                            {translate('noAttachments')}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.2}>
                        {attachments.map((attachment) => {
                            const attachmentName = getAttachmentName(
                                attachment,
                                translate('attachment')
                            );

                            return (
                                <Box
                                    key={attachment._id}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1.2}
                                        sx={{ alignItems: 'center' }}
                                    >
                                        <Box
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 3,
                                                display: 'grid',
                                                placeItems: 'center',
                                                color: 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                flexShrink: 0
                                            }}
                                        >
                                            {isImageAttachment(attachment) ? (
                                                <ImageRoundedIcon />
                                            ) : (
                                                <InsertDriveFileRoundedIcon />
                                            )}
                                        </Box>

                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {attachmentName}
                                            </Typography>

                                            <Typography variant="caption" color="text.secondary">
                                                {formatFileSize(
                                                    attachment.size,
                                                    translate('notAvailable')
                                                )}
                                            </Typography>
                                        </Box>

                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenAttachment(attachment)}
                                        >
                                            <OpenInNewRoundedIcon fontSize="small" />
                                        </IconButton>

                                        {canDeleteAttachment(attachment) && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                disabled={isDeletingAttachment}
                                                onClick={() =>
                                                    handleDeleteAttachment(attachment._id)
                                                }
                                            >
                                                <DeleteRoundedIcon fontSize="small" />
                                            </IconButton>
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