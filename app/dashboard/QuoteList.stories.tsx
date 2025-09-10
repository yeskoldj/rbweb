import type { Meta, StoryObj } from '@storybook/react';
import QuoteList from './QuoteList';
import { Quote } from './types';

const sampleQuotes: Quote[] = [
  {
    id: '1',
    customer_name: 'Jane Doe',
    customer_phone: '123-456-7890',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];

const meta: Meta<typeof QuoteList> = {
  component: QuoteList,
  args: {
    quotes: sampleQuotes,
    onStatusUpdate: () => {},
    onFinalize: () => {},
    onDelete: async () => {},
  },
};

export default meta;

type Story = StoryObj<typeof QuoteList>;

export const Default: Story = {};

