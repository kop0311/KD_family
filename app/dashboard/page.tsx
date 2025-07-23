import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardContent } from '@/components/features/dashboard/DashboardContent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: '仪表板 - KD之家',
  description: '查看家务积分概览和最新动态'
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
