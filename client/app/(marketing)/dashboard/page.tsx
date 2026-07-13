import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: 'Your dashboard',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
