import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { FormField, FormContainer, FormActions } from '@/components/ui/FormField';
import { useAuth } from '@/components/features/auth/AuthProvider';
import { useNotification } from '@/components/common/NotificationProvider';
import { useForm } from '@/hooks/useForm';
import { validateEmail, validateFullName } from '@/utils/validation';
import { userAPI } from '@/services/api';
import {
  Camera,
  Edit,
  Trophy,
  CheckCircle,
  Star,
  Calendar,
  Mail,
  User,
  Award
} from 'lucide-react';

interface ProfileEditFormData {
  fullName: string;
  email: string;
  bio?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'text-blue-400' }) => {
  return (
    <GlassContainer className="p-6 text-center">
      <div className={`${color} mb-3 flex justify-center`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/70 text-sm">{title}</div>
    </GlassContainer>
  );
};

const ProfileEditForm: React.FC<{
  user: any;
  onSubmit: (data: ProfileEditFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ user, onSubmit, onCancel, isLoading }) => {
  const form = useForm<ProfileEditFormData>({
    initialValues: {
      fullName: user.fullName || '',
      email: user.email || '',
      bio: user.bio || ''
    },
    validators: {
      fullName: validateFullName,
      email: validateEmail
    },
    onSubmit: async (values) => {
      onSubmit(values);
    }
  });

  return (
    <FormContainer onSubmit={form.handleSubmit}>
      <FormField
        label="姓名"
        name="fullName"
        type="text"
        value={form.values.fullName}
        onChange={form.handleChange('fullName')}
        onBlur={form.handleBlur('fullName')}
        placeholder="请输入姓名"
        required
        error={form.errors.fullName}
        validator={(value) => {
          const result = validateFullName(value);
          return result.isValid ? null : (result.message || '验证失败');
        }}
      />

      <FormField
        label="邮箱"
        name="email"
        type="email"
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        placeholder="请输入邮箱"
        required
        error={form.errors.email}
        validator={(value) => {
          const result = validateEmail(value);
          return result.isValid ? null : (result.message || '验证失败');
        }}
      />

      <FormField
        label="个人简介"
        name="bio"
        type="textarea"
        value={form.values.bio || ''}
        onChange={form.handleChange('bio')}
        onBlur={form.handleBlur('bio')}
        placeholder="介绍一下自己..."
        rows={3}
      />

      <FormActions>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={!form.isValid}
        >
          保存更改
        </Button>
      </FormActions>
    </FormContainer>
  );
};

const ProfileDisplay: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm mb-1">姓名</label>
        <p className="text-white text-lg">{user.fullName || '未设置'}</p>
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-1">邮箱</label>
        <p className="text-white">{user.email}</p>
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-1">角色</label>
        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
          {user.role === 'advisor' ? '顾问' : user.role === 'parent' ? '家长' : '家庭成员'}
        </span>
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-1">注册时间</label>
        <p className="text-white/80">{new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
      </div>

      {user.bio && (
        <div>
          <label className="block text-white/70 text-sm mb-1">个人简介</label>
          <p className="text-white/80">{user.bio}</p>
        </div>
      )}
    </div>
  );
};

export const UserProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);

  const { user } = useAuth();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // 获取用户统计数据
  const { data: userStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: () => userAPI.getUser(user?.id || 0),
    enabled: !!user?.id
  });

  // 更新用户资料
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileEditFormData) => {
      // TODO: Implement userAPI.updateUser when endpoint is available
      throw new Error('更新用户资料功能暂未实现');
    },
    onSuccess: (updatedUser) => {
      // TODO: Update user context when updateUser function is available
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      addNotification({
        type: 'success',
        message: '个人资料更新成功'
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || '更新失败，请重试'
      });
    }
  });

  // 上传头像
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // TODO: Implement userAPI.uploadAvatar when endpoint is available
      throw new Error('头像上传功能暂未实现');
    },
    onSuccess: (response) => {
      // TODO: Update user context when updateUser function is available
      addNotification({
        type: 'success',
        message: '头像上传成功'
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || '头像上传失败'
      });
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification({
          type: 'error',
          message: '文件大小不能超过5MB'
        });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassContainer className="p-8 text-center">
          <p className="text-white">请先登录</p>
        </GlassContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">个人资料</h1>
          <p className="text-white/70">管理您的个人信息和账户设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 头像和基本信息 */}
          <GlassContainer className="p-6 lg:col-span-1">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username[0]?.toUpperCase()
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  loading={uploadAvatarMutation.isPending}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
              <p className="text-white/70 text-sm mb-4">{user.email}</p>

              <div className="flex items-center justify-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-white/50" />
                <span className="text-white/70">
                  加入于 {new Date(user.createdAt || Date.now()).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </GlassContainer>

          {/* 详细信息 */}
          <GlassContainer className="p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">个人信息</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={updateProfileMutation.isPending}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? '取消' : '编辑'}
              </Button>
            </div>

            {isEditing ? (
              <ProfileEditForm
                user={user}
                onSubmit={(data) => updateProfileMutation.mutate(data)}
                onCancel={() => setIsEditing(false)}
                isLoading={updateProfileMutation.isPending}
              />
            ) : (
              <ProfileDisplay user={user} />
            )}
          </GlassContainer>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="总积分"
            value={userStats?.data?.totalPoints || 0}
            icon={<Trophy className="w-8 h-8" />}
            color="text-yellow-400"
          />
          <StatCard
            title="完成任务"
            value={userStats?.data?.completedTasks || 0}
            icon={<CheckCircle className="w-8 h-8" />}
            color="text-green-400"
          />
          <StatCard
            title="当前等级"
            value={userStats?.data?.level || 1}
            icon={<Star className="w-8 h-8" />}
            color="text-purple-400"
          />
          <StatCard
            title="获得徽章"
            value={userStats?.data?.badges || 0}
            icon={<Award className="w-8 h-8" />}
            color="text-blue-400"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
