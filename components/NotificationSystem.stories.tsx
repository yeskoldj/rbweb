import type { Meta, StoryObj } from '@storybook/react';
import NotificationSystem from './NotificationSystem';
import { Notification } from '@/lib/hooks/useNotifications';

const sample: Notification[] = [
  { id: '1', type: 'success', title: 'Success', message: 'Operation complete' },
  { id: '2', type: 'error', title: 'Error', message: 'Something went wrong' },
];

const meta: Meta<typeof NotificationSystem> = {
  component: NotificationSystem,
  args: {
    notifications: sample,
    onDismiss: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof NotificationSystem>;

export const Default: Story = {};

