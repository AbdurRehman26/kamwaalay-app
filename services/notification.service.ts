import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from './api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'request' | 'message' | 'success' | 'info' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    data?: any; // Additional data like requestId, conversationId, etc.
}

export interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
}

class NotificationService {
    /**
     * Get all notifications
     */
    async getNotifications(page: number = 1, limit: number = 20) {
        const response = await apiService.get<any>(API_ENDPOINTS.NOTIFICATIONS.LIST, undefined, { page, limit });

        if (response.success && response.data) {
            let rawNotifs: any[] = [];

            if (Array.isArray(response.data)) {
                rawNotifs = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (Array.isArray(response.data.notifications)) {
                    rawNotifs = response.data.notifications;
                } else if (Array.isArray(response.data.data)) {
                    rawNotifs = response.data.data;
                }
            }

            // Ensure it is an array
            if (!Array.isArray(rawNotifs)) {
                rawNotifs = [];
            }

            const notifications: Notification[] = rawNotifs.map((n: any) => ({
                id: n.id?.toString() || Date.now().toString(),
                title: n.title || 'Notification',
                message: n.message || n.body || '',
                type: n.type || 'info',
                read: n.read || n.is_read || false,
                createdAt: n.created_at || n.createdAt || new Date().toISOString(),
                data: n.data,
            }));

            return {
                ...response,
                data: {
                    notifications,
                    unreadCount: response.data.unread_count || response.data.unreadCount || 0,
                },
            };
        }

        return response;
    }

    /**
     * Get unread notifications count
     */
    async getUnreadCount() {
        return await apiService.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string) {
        return await apiService.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, undefined, { id });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        return await apiService.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    }
}

export const notificationService = new NotificationService();
