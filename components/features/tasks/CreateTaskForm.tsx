import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { FormField, FormContainer, FormActions } from '@/components/ui/FormField';
import { useNotification } from '@/components/common/NotificationProvider';
import { useForm } from '@/hooks/useForm';
import { validateTaskTitle, validateTaskDescription, validatePoints, validateDate } from '@/utils/validation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface CreateTaskFormData {
  title: string;
  description: string;
  taskType: 'PM' | 'FTL' | 'PA' | 'UBI';
  points: number;
  dueDate: string;
}

export const CreateTaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // 创建任务的 mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskFormData) => taskAPI.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification({
        type: 'success',
        message: '任务创建成功！'
      });
      navigate('/tasks');
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || '任务创建失败，请重试'
      });
    }
  });

  // 表单配置
  const form = useForm<CreateTaskFormData>({
    initialValues: {
      title: '',
      description: '',
      taskType: 'PM',
      points: 10,
      dueDate: ''
    },
    validators: {
      title: validateTaskTitle,
      description: validateTaskDescription,
      points: validatePoints,
      dueDate: validateDate
    },
    onSubmit: async (values) => {
      await createTaskMutation.mutateAsync(values);
    }
  });

  const taskTypeOptions = [
    { value: 'PM', label: 'PM - 项目管理' },
    { value: 'FTL', label: 'FTL - 功能测试' },
    { value: 'PA', label: 'PA - 流程分析' },
    { value: 'UBI', label: 'UBI - 用户行为洞察' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">创建新任务</h1>
          <p className="text-white/70">填写任务详情，为家庭成员分配新的任务</p>
        </div>

        <GlassContainer className="p-8">
          <FormContainer onSubmit={form.handleSubmit}>
            <div className="space-y-6">
              <FormField
                label="任务标题"
                name="title"
                type="text"
                value={form.values.title}
                onChange={form.handleChange('title')}
                onBlur={form.handleBlur('title')}
                placeholder="输入任务标题"
                required
                error={form.errors.title}
                validator={(value) => {
                  const result = validateTaskTitle(value);
                  return result.isValid ? null : (result.message || '验证失败');
                }}
              />

              <FormField
                label="任务描述"
                name="description"
                type="textarea"
                value={form.values.description}
                onChange={form.handleChange('description')}
                onBlur={form.handleBlur('description')}
                placeholder="详细描述任务内容"
                required
                rows={4}
                error={form.errors.description}
                validator={(value) => {
                  const result = validateTaskDescription(value);
                  return result.isValid ? null : (result.message || '验证失败');
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="任务类型"
                  name="taskType"
                  type="select"
                  value={form.values.taskType}
                  onChange={form.handleChange('taskType')}
                  onBlur={form.handleBlur('taskType')}
                  required
                  options={taskTypeOptions}
                />

                <FormField
                  label="积分奖励"
                  name="points"
                  type="number"
                  value={form.values.points}
                  onChange={form.handleChange('points')}
                  onBlur={form.handleBlur('points')}
                  placeholder="10"
                  required
                  min={1}
                  max={1000}
                  error={form.errors.points}
                  validator={(value) => {
                    const result = validatePoints(Number(value));
                    return result.isValid ? null : (result.message || '验证失败');
                  }}
                />
              </div>

              <FormField
                label="截止日期"
                name="dueDate"
                type="datetime-local"
                value={form.values.dueDate}
                onChange={form.handleChange('dueDate')}
                onBlur={form.handleBlur('dueDate')}
                required
                error={form.errors.dueDate}
                validator={(value) => {
                  const result = validateDate(value);
                  return result.isValid ? null : (result.message || '验证失败');
                }}
              />

              <div className="bg-blue-500/10 border border-blue-300/20 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">任务类型说明</h3>
                <div className="text-white/70 text-sm space-y-1">
                  <p><strong>PM</strong> - 项目管理类任务，如计划制定、进度跟踪</p>
                  <p><strong>FTL</strong> - 功能测试类任务，如产品测试、质量检查</p>
                  <p><strong>PA</strong> - 流程分析类任务，如流程优化、效率分析</p>
                  <p><strong>UBI</strong> - 用户行为洞察类任务，如数据分析、用户研究</p>
                </div>
              </div>
            </div>

            <FormActions className="mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/tasks')}
                disabled={form.isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={form.isSubmitting || createTaskMutation.isPending}
                disabled={!form.isValid}
              >
                {form.isSubmitting || createTaskMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    创建中...
                  </>
                ) : (
                  '创建任务'
                )}
              </Button>
            </FormActions>
          </FormContainer>
        </GlassContainer>

        {/* 预览卡片 */}
        {(form.values.title || form.values.description) && (
          <div className="mt-8">
            <h3 className="text-white font-medium mb-4">任务预览</h3>
            <GlassContainer className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    {form.values.title || '任务标题'}
                  </h4>
                  <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full mt-2">
                    {taskTypeOptions.find(opt => opt.value === form.values.taskType)?.label || 'PM - 项目管理'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {form.values.points || 10}
                  </div>
                  <div className="text-white/70 text-sm">积分</div>
                </div>
              </div>

              <p className="text-white/80 mb-4">
                {form.values.description || '任务描述将在这里显示...'}
              </p>

              {form.values.dueDate && (
                <div className="text-white/70 text-sm">
                  截止时间: {new Date(form.values.dueDate).toLocaleString('zh-CN')}
                </div>
              )}
            </GlassContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTaskForm;
