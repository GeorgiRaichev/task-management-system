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
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useTranslate } from '../../hooks/useTranslate';

type ProjectNeedsGroupDialogProps = {
    projectName?: string;
    onBack: () => void;
};

export default function ProjectNeedsGroupDialog({
    projectName,
    onBack
}: ProjectNeedsGroupDialogProps) {
    const translate = useTranslate();

    return (
        <Dialog open onClose={onBack} fullWidth maxWidth="xs">
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <WarningAmberRoundedIcon color="warning" />

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            {projectName || translate('projectBoard')}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {translate('projectBoard')}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent>
                <Alert severity="warning" sx={{ mt: 1 }}>
                    {translate('projectNeedsGroup')}
                </Alert>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button variant="contained" onClick={onBack}>
                    {translate('projects')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}