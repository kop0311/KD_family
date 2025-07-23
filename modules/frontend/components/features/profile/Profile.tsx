import React from 'react';
import { GlassContainer } from '@components/ui/GlassContainer';

const Profile: React.FC = () => {
  return (
    <GlassContainer className="p-8">
      <h2 className="text-3xl font-bold text-white mb-4">个人资料</h2>
      <p className="text-glass-muted">个人资料功能正在开发中...</p>
    </GlassContainer>
  );
};

export default Profile;
