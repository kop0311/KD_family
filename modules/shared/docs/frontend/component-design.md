# KD Family Frontend - Modern Component Architecture

## 🎯 Design Principles

- **Component-First**: Reusable, composable React components
- **Mobile-First**: Responsive design starting from mobile
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Code splitting, lazy loading, optimized bundles
- **State Management**: Redux Toolkit for complex state, Context for simple shared state
- **Design System**: Consistent spacing, colors, typography using CSS-in-JS

## 🏗️ Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   ├── forms/          # Form-specific components
│   ├── layout/         # Layout components
│   └── feedback/       # Loading, error, success components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication feature
│   ├── tasks/         # Task management feature
│   ├── family/        # Family management feature
│   ├── points/        # Points & achievements feature
│   └── notifications/ # Notifications feature
├── hooks/             # Custom React hooks
├── services/          # API services and utilities
├── store/             # Redux store configuration
├── styles/            # Global styles and theme
├── utils/             # Utility functions
└── App.tsx            # Root application component
```

## 🧩 Component Design System

### Color Palette
```typescript
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    success: {
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      900: '#111827'
    }
  },
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem'     // 48px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  }
};
```

### Typography Components
```typescript
// src/components/ui/Typography.tsx
interface TextProps {
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'overline';
  color?: keyof typeof theme.colors;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({ 
  variant, 
  color = 'gray', 
  weight = 'normal',
  align = 'left',
  className,
  children 
}) => {
  // Component implementation
};

// Usage examples:
<Text variant="h1" color="primary" weight="bold">
  Welcome to KD Family
</Text>

<Text variant="body" color="gray">
  Complete tasks to earn points and climb the leaderboard!
</Text>
```

### Button Component System
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = (props) => {
  // Component implementation with loading states, accessibility
};

// Usage examples:
<Button variant="primary" size="lg" loading={isSubmitting}>
  Create Task
</Button>

<Button variant="outline" icon={<PlusIcon />} iconPosition="left">
  Add Member
</Button>
```

## 🏠 Feature-Based Architecture

### Task Management Feature
```typescript
// src/features/tasks/components/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  currentUser: User;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  currentUser,
  compact = false 
}) => {
  return (
    <div className="task-card">
      <div className="task-header">
        <TaskTypeIcon type={task.taskType.code} />
        <Text variant="body" weight="semibold">{task.title}</Text>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="task-content">
        <Text variant="caption" color="gray">
          {task.description}
        </Text>
        
        <div className="task-meta">
          <PointsDisplay points={task.points} />
          <DueDateDisplay dueDate={task.dueDate} />
          {task.assignment && (
            <UserAvatar 
              user={task.assignment.assignedTo} 
              size="sm"
              showName 
            />
          )}
        </div>
      </div>
      
      <TaskActions 
        task={task}
        currentUser={currentUser}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
      />
    </div>
  );
};
```

### Family Dashboard Component
```typescript
// src/features/family/components/FamilyDashboard.tsx
export const FamilyDashboard: React.FC = () => {
  const { family, isLoading } = useFamily();
  const { leaderboard } = useLeaderboard();
  const { weeklyProgress } = useWeeklyProgress();

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="dashboard">
      <DashboardHeader family={family} />
      
      <div className="dashboard-grid">
        <WeeklyProgressCard progress={weeklyProgress} />
        <QuickStatsCard family={family} />
        <LeaderboardCard 
          leaderboard={leaderboard} 
          compact 
          maxItems={5}
        />
        <RecentActivityCard limit={10} />
      </div>
      
      <QuickActions />
    </div>
  );
};
```

## 🔄 State Management Architecture

### Redux Store Structure
```typescript
// src/store/index.ts
export interface RootState {
  auth: AuthState;
  family: FamilyState;
  tasks: TasksState;
  points: PointsState;
  notifications: NotificationsState;
  ui: UIState;
}

// Feature-based slices
// src/features/tasks/store/tasksSlice.ts
interface TasksState {
  items: Task[];
  filters: TaskFilters;
  pagination: Pagination;
  loading: {
    fetch: boolean;
    create: boolean;
    update: boolean;
  };
  error: string | null;
}

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      const task = state.items.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        task.updatedAt = new Date().toISOString();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading.fetch = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.items = action.payload.tasks;
        state.pagination = action.payload.pagination;
      });
  }
});
```

### Custom Hooks for State Management
```typescript
// src/features/tasks/hooks/useTasks.ts
export const useTasks = (filters?: TaskFilters) => {
  const dispatch = useAppDispatch();
  const { items, loading, error, pagination } = useAppSelector(state => state.tasks);

  const fetchTasks = useCallback((filters?: TaskFilters) => {
    dispatch(fetchTasksAsync(filters));
  }, [dispatch]);

  const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
    dispatch(updateTaskStatusAsync({ taskId, status }));
  }, [dispatch]);

  const createTask = useCallback((taskData: CreateTaskRequest) => {
    return dispatch(createTaskAsync(taskData));
  }, [dispatch]);

  useEffect(() => {
    fetchTasks(filters);
  }, [fetchTasks, filters]);

  return {
    tasks: items,
    loading,
    error,
    pagination,
    fetchTasks,
    updateTaskStatus,
    createTask
  };
};
```

## 📱 Responsive Design Patterns

### Breakpoint System
```typescript
export const breakpoints = {
  mobile: '320px',
  tablet: '768px', 
  desktop: '1024px',
  wide: '1440px'
};

// Usage with styled-components or CSS-in-JS
const TaskGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.desktop}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

### Mobile-First Navigation
```typescript
// src/components/layout/Navigation.tsx
export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="navigation">
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <MenuIcon />
      </button>

      {/* Desktop navigation */}
      <div className="desktop-nav">
        <NavLink to="/dashboard" icon={<HomeIcon />}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" icon={<TaskIcon />}>
          Tasks
        </NavLink>
        <NavLink to="/leaderboard" icon={<TrophyIcon />}>
          Leaderboard
        </NavLink>
      </div>

      {/* Mobile sliding menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  );
};
```

## ♿ Accessibility Features

### Screen Reader Support
```typescript
// src/components/ui/ScreenReaderOnly.tsx
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Usage in components
<Button variant="primary">
  <PlusIcon aria-hidden="true" />
  <ScreenReaderOnly>Add new task</ScreenReaderOnly>
</Button>
```

### Focus Management
```typescript
// src/hooks/useFocusManagement.ts
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement>(null);

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const trapFocus = useCallback((element: HTMLElement) => {
    // Focus trap implementation for modals
  }, []);

  return { focusRef, setFocus, trapFocus };
};
```

## 🚀 Performance Optimizations

### Code Splitting
```typescript
// src/App.tsx
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Tasks = lazy(() => import('./features/tasks/Tasks'));
const Leaderboard = lazy(() => import('./features/leaderboard/Leaderboard'));

export const App: React.FC = () => (
  <Router>
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Suspense>
    </Layout>
  </Router>
);
```

### Virtual Scrolling for Large Lists
```typescript
// src/components/ui/VirtualizedList.tsx
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
}

export const VirtualizedList = <T,>({
  items,
  renderItem,
  itemHeight,
  containerHeight
}: VirtualizedListProps<T>) => {
  // Virtual scrolling implementation
};
```

## 🔔 Real-time Features

### WebSocket Integration
```typescript
// src/services/websocket.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    this.ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.emit(message.type, message.data);
    };
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// src/hooks/useRealtime.ts
export const useRealtime = () => {
  const dispatch = useAppDispatch();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      const ws = new WebSocketService();
      ws.connect(token);

      ws.subscribe('task_assigned', (data) => {
        dispatch(addNotification({
          type: 'task_assigned',
          message: `You've been assigned: ${data.taskTitle}`,
          data
        }));
      });

      ws.subscribe('points_updated', (data) => {
        dispatch(updateUserPoints(data));
      });

      return () => ws.disconnect();
    }
  }, [token, dispatch]);
};
```

This modern component architecture provides a scalable, maintainable foundation for the KD Family system with enterprise-grade patterns and user experience design.