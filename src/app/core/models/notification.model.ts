export interface Notification {
  notificationId: string;
  customerId: string;
  type: string;
  channel: string;
  message: string;
  deliveryStatus: string;
  createdAt: string;
}
