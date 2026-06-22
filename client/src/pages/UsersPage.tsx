import { Card, Stack, Typography } from '@mui/material';
import { useTranslate } from '../hooks/useTranslate';

export default function UsersPage() {
    const translate = useTranslate();

    return (
        <Stack spacing={3}>
            <Typography variant="h4">{translate('users')}</Typography>

            <Card sx={{ p: 3 }}>
                <Typography>{translate('noData')}</Typography>
            </Card>
        </Stack>
    );
}