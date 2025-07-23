import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProfileContent } from '@/components/features/profile/ProfileContent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: '个人资料 - KD之家',
  description: '管理个人资料和设置'
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
