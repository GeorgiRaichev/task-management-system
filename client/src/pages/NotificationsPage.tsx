import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
  type ChipProps,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";

import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../features/notifications/notificationsApi";
import type { AppNotification } from "../features/notifications/types";
import { useTranslate } from "../hooks/useTranslate";
import type { TranslationKey } from "../i18n/translations";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDate } from "../utils/date";

const notificationTypeLabels: Record<string, TranslationKey> = {
  general: "general",
  task_assigned: "taskAssigned",
  task_status_changed: "taskStatusChanged",
  comment_added: "commentAdded",
  attachment_added: "attachmentAdded",
};

const getNotificationTypeLabel = (type: string): TranslationKey => {
  const normalizedType = type.toLowerCase();

  return notificationTypeLabels[normalizedType] || "general";
};

const getNotificationColor = (
  notification: AppNotification,
): ChipProps["color"] => {
  if (!notification.isRead) {
    return "primary";
  }

  return "default";
};

export default function NotificationsPage() {
  const theme = useTheme();
  const translate = useTranslate();

  const { data, isLoading, isFetching } = useGetNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [markAsRead, { isLoading: isMarking }] =
    useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] =
    useDeleteNotificationMutation();

  const [notificationToDelete, setNotificationToDelete] =
    useState<AppNotification | null>(null);
  const [error, setError] = useState("");

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.isRead) {
      return;
    }

    setError("");

    try {
      await markAsRead(notification._id).unwrap();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleMarkAllAsRead = async () => {
    setError("");

    try {
      await markAllAsRead().unwrap();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  const handleOpenDelete = (notification: AppNotification) => {
    setError("");
    setNotificationToDelete(notification);
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setNotificationToDelete(null);
    setError("");
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) {
      return;
    }

    try {
      await deleteNotification(notificationToDelete._id).unwrap();
      setNotificationToDelete(null);
      setError("");
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, translate("operationFailed")));
    }
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 3,
          borderRadius: 5,
          background: "linear-gradient(135deg, #0f172a 0%, #7c3aed 100%)",
          color: "common.white",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 4,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha("#ffffff", 0.16),
                border: `1px solid ${alpha("#ffffff", 0.24)}`,
              }}
            >
              <NotificationsRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h4">{translate("notifications")}</Typography>
              <Typography sx={{ opacity: 0.78 }}>
                {unreadCount} {translate("unread").toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<DoneAllRoundedIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAll}
            sx={{
              bgcolor: "common.white",
              color: "primary.main",
              "&:hover": {
                bgcolor: alpha("#ffffff", 0.9),
              },
            }}
          >
            {translate("markAllAsRead")}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Card sx={{ overflow: "hidden" }}>
        {isLoading || isFetching ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6">{translate("noData")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {translate("notifications")}
            </Typography>
          </Box>
        ) : (
          <Stack>
            {notifications.map((notification) => (
              <Box
                key={notification._id}
                sx={{
                  p: 2.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  bgcolor: notification.isRead
                    ? "background.paper"
                    : alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", md: "center" },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 4,
                        display: "grid",
                        placeItems: "center",
                        color: notification.isRead
                          ? "text.secondary"
                          : "primary.main",
                        bgcolor: notification.isRead
                          ? alpha(theme.palette.text.secondary, 0.08)
                          : alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <NotificationsRoundedIcon />
                    </Box>

                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6">
                          {notification.title}
                        </Typography>

                        <Chip
                          label={
                            notification.isRead
                              ? translate("read")
                              : translate("unread")
                          }
                          color={getNotificationColor(notification)}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />

                        <Chip
                          label={translate(
                            getNotificationTypeLabel(notification.type),
                          )}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>

                      <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                        {notification.message}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          mt: 1.5,
                          flexWrap: "wrap",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="caption">
                          {formatDate(
                            notification.createdAt,
                            translate("notAvailable"),
                          )}
                        </Typography>

                        {notification.sender && (
                          <Typography variant="caption">
                            • {translate("sender")}:{" "}
                            {notification.sender.firstName}{" "}
                            {notification.sender.lastName}
                          </Typography>
                        )}

                        {notification.project && (
                          <Typography variant="caption">
                            • {translate("relatedProject")}:{" "}
                            {notification.project.name}
                          </Typography>
                        )}

                        {notification.task && (
                          <Typography variant="caption">
                            • {translate("relatedTask")}:{" "}
                            {notification.task.title}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {!notification.isRead && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MarkEmailReadRoundedIcon />}
                        onClick={() => handleMarkAsRead(notification)}
                        disabled={isMarking}
                      >
                        {translate("markAsRead")}
                      </Button>
                    )}

                    <IconButton
                      color="error"
                      onClick={() => handleOpenDelete(notification)}
                    >
                      <DeleteRoundedIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      <Dialog
        open={Boolean(notificationToDelete)}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{translate("deleteNotification")}</DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography>{translate("confirmDelete")}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} disabled={isDeleting}>
            {translate("cancel")}
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {translate("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
