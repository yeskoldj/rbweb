import type { Meta, StoryObj } from '@storybook/react';
import OrderList from './OrderList';
import { Order } from '@/lib/supabase';

const sampleOrders: Order[] = [
  {
    id: '1',
    customer_name: 'John Doe',
    customer_phone: '123-456-7890',
    items: [{ id: '1', name: 'Cake', price: '$10', quantity: 1 }],
    subtotal: 10,
    tax: 0.3,
    total: 10.3,
    status: 'pending',
    order_date: new Date().toISOString().split('T')[0],
    payment_status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const meta: Meta<typeof OrderList> = {
  component: OrderList,
  args: {
    orders: sampleOrders,
    currentUser: { role: 'owner' },
    onStatusUpdate: () => {},
    onDelete: async () => {},
    setShowTodayView: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof OrderList>;

export const Default: Story = {};

