import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TaskCard } from '../features/tasks/TaskList';
import { Task } from '@/types/task';

// Mock the notification provider
jest.mock('@/components/common/NotificationProvider', () => ({
  useNotification: () => ({
    addNotification: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock the enhanced UI components
jest.mock('@/components/ui/enhanced/MagicCard', () => ({
  MagicCard: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  )
}));

jest.mock('@/components/ui/enhanced/MagicButton', () => ({
  MagicButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  AnimatedButtonGroup: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/enhanced/AnimatedComponents', () => ({
  SuccessAnimation: ({ show, onComplete }: any) =>
    show ? <div data-testid="success-animation" onClick={onComplete}>Success!</div> : null
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 1,
    title: '测试任务',
    description: '这是一个测试任务的描述',
    taskType: 'PM',
    points: 10,
    status: 'pending',
    createdBy: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该渲染任务基本信息', () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('测试任务')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试任务的描述')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('积分')).toBeInTheDocument();
  });

  it('应该显示正确的任务状态', () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('待认领')).toBeInTheDocument();
  });

  it('应该在待认领状态显示认领按钮', () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const claimButton = screen.getByText('认领任务');
    expect(claimButton).toBeInTheDocument();
  });

  it('应该在已认领状态显示开始执行按钮', () => {
    const claimedTask = { ...mockTask, status: 'claimed' as const };

    render(
      <TaskCard task={claimedTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const startButton = screen.getByText('开始执行');
    expect(startButton).toBeInTheDocument();
  });

  it('应该在进行中状态显示完成任务按钮', () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' as const };

    render(
      <TaskCard task={inProgressTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const completeButton = screen.getByText('完成任务');
    expect(completeButton).toBeInTheDocument();
  });

  it('应该在已完成状态显示批准完成按钮', () => {
    const completedTask = { ...mockTask, status: 'completed' as const };

    render(
      <TaskCard task={completedTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const approveButton = screen.getByText('批准完成');
    expect(approveButton).toBeInTheDocument();
  });

  it('应该处理任务状态变更', async () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const claimButton = screen.getByText('认领任务');
    fireEvent.click(claimButton);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(1, 'claimed');
    });
  });

  it('应该在完成任务时显示成功动画', async () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' as const };

    render(
      <TaskCard task={inProgressTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    const completeButton = screen.getByText('完成任务');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-animation')).toBeInTheDocument();
    });
  });

  it('应该显示截止日期信息', () => {
    const taskWithDueDate = {
      ...mockTask,
      dueDate: '2024-12-31T23:59:59Z'
    };

    render(
      <TaskCard task={taskWithDueDate} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2024/12/31')).toBeInTheDocument();
  });

  it('应该显示无截止日期信息', () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('无截止日期')).toBeInTheDocument();
  });

  it('应该显示任务分配信息', () => {
    const assignedTask = { ...mockTask, assignedTo: 2 };

    render(
      <TaskCard task={assignedTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('已分配')).toBeInTheDocument();
  });

  it('应该显示创建时间', () => {
    render(
      <TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('创建于 2024/1/1')).toBeInTheDocument();
  });
});
