import { Box, Button, IconButton, Stack, Typography, alpha } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useTranslate } from '../../hooks/useTranslate';

type ProjectBoardHeaderProps = {
    projectName?: string;
    tasksCount: number;
    canManageTasks: boolean;
    onBack: () => void;
    onCreateTask: () => void;
};

export default function ProjectBoardHeader({
    projectName,
    tasksCount,
    canManageTasks,
    onBack,
    onCreateTask
}: ProjectBoardHeaderProps) {
    const translate = useTranslate();

    return (
        <Box
            sx={{
                p: 3,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
                color: 'common.white',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)'
            }}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' }
                }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <IconButton
                        onClick={onBack}
                        sx={{
                            color: 'common.white',
                            bgcolor: alpha('#ffffff', 0.16),
                            '&:hover': {
                                bgcolor: alpha('#ffffff', 0.24)
                            }
                        }}
                    >
                        <ArrowBackRoundedIcon />
                    </IconButton>

                    <Box>
                        <Typography variant="h4">
                            {projectName || translate('projectBoard')}
                        </Typography>

                        <Typography sx={{ opacity: 0.78 }}>
                            {tasksCount} {translate('tasks').toLowerCase()}
                        </Typography>
                    </Box>
                </Stack>

                {canManageTasks && (
                    <Button
                        type="button"
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={onCreateTask}
                        sx={{
                            bgcolor: 'common.white',
                            color: 'primary.main',
                            '&:hover': {
                                bgcolor: alpha('#ffffff', 0.9)
                            }
                        }}
                    >
                        {translate('createTask')}
                    </Button>
                )}
            </Stack>
        </Box>
    );
}