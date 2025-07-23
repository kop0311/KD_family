import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AdminContent } from '@/components/features/admin/AdminContent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: '管理面板 - KD之家',
  description: '系统管理和配置'
};

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="advisor">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <AdminContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
