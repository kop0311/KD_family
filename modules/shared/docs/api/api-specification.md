# KD Family API Specification v2.0

## 📋 API Overview

**Base URL**: `https://api.kdfamily.com/v1`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`  
**Rate Limiting**: 100 requests/minute per user

## 🔐 Authentication Endpoints

### POST /auth/login
Login with username/email and password.

```json
Request:
{
  "identifier": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "john_doe",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "member",
      "avatarUrl": "https://api.dicebear.com/9.x/avataaars/svg?seed=john",
      "familyId": 1,
      "familyRole": "child"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### POST /auth/register
Register new user account.

```json
Request:
{
  "username": "jane_doe",
  "email": "jane@example.com", 
  "password": "securePassword123",
  "fullName": "Jane Doe",
  "familyCode": "SMITH2024"
}

Response:
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/refresh
Refresh JWT token.

### POST /auth/logout
Logout and invalidate token.

## 👨‍👩‍👧‍👦 Family Management Endpoints

### GET /families/current
Get current user's family information.

```json
Response:
{
  "success": true,
  "data": {
    "family": {
      "id": 1,
      "name": "The Smith Family",
      "code": "SMITH2024",
      "settings": {
        "pointsPerTask": 10,
        "weeklyGoal": 100,
        "allowSelfAssignment": true,
        "requireParentApproval": false
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "members": [
        {
          "id": 123,
          "username": "john_doe",
          "fullName": "John Doe",
          "role": "child",
          "permissions": ["view_tasks", "complete_tasks"],
          "totalPoints": 450,
          "weeklyPoints": 75,
          "joinedAt": "2024-01-01T00:00:00Z"
        }
      ]
    }
  }
}
```

### POST /families
Create new family (parent/guardian only).

```json
Request:
{
  "name": "The Johnson Family",
  "settings": {
    "pointsPerTask": 15,
    "weeklyGoal": 150,
    "allowSelfAssignment": false,
    "requireParentApproval": true
  }
}
```

### PUT /families/{familyId}
Update family settings (parent/guardian only).

### POST /families/{familyId}/invite
Generate invitation code for family.

### POST /families/join
Join family using invitation code.

```json
Request:
{
  "familyCode": "SMITH2024",
  "role": "child"
}
```

### DELETE /families/{familyId}/members/{userId}
Remove member from family (parent only).

## 📝 Enhanced Task Management Endpoints

### GET /tasks
Get tasks with advanced filtering and pagination.

**Query Parameters**:
- `status`: pending, assigned, in_progress, completed, verified
- `assignedTo`: User ID
- `familyId`: Family ID
- `taskType`: Task type code
- `dueBefore`: ISO date
- `dueAfter`: ISO date  
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: created_at, due_date, points, priority
- `sortOrder`: asc, desc

```json
Response:
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 456,
        "title": "Clean the kitchen",
        "description": "Wash dishes, wipe counters, sweep floor",
        "taskType": {
          "code": "UBI",
          "name": "通用家务",
          "defaultPoints": 12
        },
        "status": "pending",
        "points": 15,
        "priority": "medium",
        "estimatedDuration": 30,
        "dueDate": "2024-07-20T18:00:00Z",
        "createdBy": {
          "id": 1,
          "fullName": "Mom",
          "avatarUrl": "avatar_url"
        },
        "assignment": {
          "assignedTo": {
            "id": 123,
            "fullName": "John Doe",
            "avatarUrl": "avatar_url"
          },
          "assignedAt": "2024-07-19T10:00:00Z",
          "status": "pending"
        },
        "attachments": [
          {
            "id": 1,
            "filename": "kitchen_before.jpg",
            "url": "/uploads/attachments/kitchen_before.jpg",
            "type": "image"
          }
        ],
        "recurring": {
          "isRecurring": true,
          "pattern": "weekly",
          "daysOfWeek": [1, 3, 5], // Monday, Wednesday, Friday
          "endDate": null
        },
        "createdAt": "2024-07-19T09:00:00Z",
        "updatedAt": "2024-07-19T10:00:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "hasNext": true,
      "hasPrev": false,
      "limit": 20
    },
    "summary": {
      "totalTasks": 85,
      "pendingTasks": 12,
      "completedTasks": 67,
      "totalPoints": 890
    }
  }
}
```

### POST /tasks
Create new task with enhanced features.

```json
Request:
{
  "title": "Clean the garage",
  "description": "Organize tools, sweep floor, dispose of trash",
  "taskTypeCode": "UBI",
  "points": 25,
  "priority": "high",
  "estimatedDuration": 120,
  "dueDate": "2024-07-21T16:00:00Z",
  "assignedTo": 123,
  "attachments": ["garage_before.jpg"],
  "recurring": {
    "isRecurring": false
  },
  "requirements": [
    "Take before and after photos",
    "Dispose of hazardous materials properly"
  ]
}
```

### PUT /tasks/{taskId}
Update task details (creator or admin only).

### POST /tasks/{taskId}/assign
Assign task to family member.

```json
Request:
{
  "assignedTo": 123,
  "dueDate": "2024-07-20T18:00:00Z",
  "message": "Please complete before dinner"
}
```

### POST /tasks/{taskId}/claim
Self-assign available task.

### POST /tasks/{taskId}/start
Mark task as in progress.

### POST /tasks/{taskId}/complete
Mark task as completed with evidence.

```json
Request:
{
  "completionNotes": "Kitchen is now spotless!",
  "attachments": ["kitchen_after.jpg"],
  "timeSpent": 35
}
```

### POST /tasks/{taskId}/verify
Verify completed task (parent/guardian only).

```json
Request:
{
  "approved": true,
  "feedback": "Great job! Kitchen looks amazing.",
  "bonusPoints": 5
}
```

### DELETE /tasks/{taskId}
Delete task (creator or admin only).

## 🏆 Points and Achievements Endpoints

### GET /points/leaderboard
Get family leaderboard with rankings.

**Query Parameters**:
- `period`: weekly, monthly, yearly, all-time
- `familyId`: Family ID

```json
Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": 123,
          "fullName": "John Doe",
          "avatarUrl": "avatar_url"
        },
        "totalPoints": 450,
        "weeklyPoints": 75,
        "tasksCompleted": 42,
        "achievements": 8,
        "streak": 5
      }
    ],
    "period": "weekly",
    "startDate": "2024-07-15T00:00:00Z",
    "endDate": "2024-07-21T23:59:59Z"
  }
}
```

### GET /points/history
Get user's point history.

### POST /points/award
Manually award points (admin only).

```json
Request:
{
  "userId": 123,
  "points": 50,
  "reason": "Exceptional help with family event",
  "category": "bonus"
}
```

### GET /achievements
Get available achievements.

### GET /achievements/earned
Get user's earned achievements.

## 🔔 Notification Endpoints

### GET /notifications
Get user notifications with real-time support.

```json
Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 789,
        "title": "Task Assigned",
        "message": "You have been assigned 'Clean the kitchen'",
        "type": "task_assigned",
        "isRead": false,
        "data": {
          "taskId": 456,
          "assignedBy": "Mom"
        },
        "createdAt": "2024-07-19T10:00:00Z"
      }
    ],
    "unreadCount": 3
  }
}
```

### PUT /notifications/{notificationId}/read
Mark notification as read.

### PUT /notifications/read-all
Mark all notifications as read.

### GET /notifications/preferences
Get notification preferences.

### PUT /notifications/preferences
Update notification preferences.

```json
Request:
{
  "email": {
    "taskAssigned": true,
    "taskCompleted": false,
    "pointsEarned": true,
    "weeklyReport": true
  },
  "push": {
    "taskDue": true,
    "taskOverdue": true,
    "familyActivity": false
  }
}
```

## 📊 Analytics Endpoints

### GET /analytics/dashboard
Get dashboard analytics.

```json
Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalTasks": 85,
      "completedTasks": 67,
      "totalPoints": 890,
      "activeMembers": 4
    },
    "weeklyProgress": {
      "currentWeek": 75,
      "previousWeek": 68,
      "goal": 100,
      "trend": "up"
    },
    "taskDistribution": [
      { "type": "UBI", "count": 25, "percentage": 30 },
      { "type": "PM", "count": 20, "percentage": 24 }
    ],
    "memberActivity": [
      {
        "userId": 123,
        "fullName": "John Doe",
        "tasksCompleted": 15,
        "pointsEarned": 180,
        "trend": "up"
      }
    ]
  }
}
```

### GET /analytics/reports
Generate custom reports.

## 🗂️ File Upload Endpoints

### POST /uploads/avatar
Upload user avatar.

### POST /uploads/attachments
Upload task attachments.

### DELETE /uploads/{fileId}
Delete uploaded file.

## ⚙️ System Endpoints

### GET /health
System health check.

### GET /config
Get system configuration (admin only).

## 📝 Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  },
  "timestamp": "2024-07-19T10:00:00Z",
  "requestId": "req_123456"
}
```

## 🔄 WebSocket Events

### Connection
Connect to `wss://api.kdfamily.com/ws` with JWT token.

### Events
- `task_assigned`: Task assignment notification
- `task_completed`: Task completion notification
- `points_updated`: Points balance update
- `family_activity`: General family activity
- `user_online`: Member comes online
- `user_offline`: Member goes offline

## 📋 API Rate Limits

- **General**: 100 requests/minute
- **Authentication**: 10 requests/minute
- **File Upload**: 20 requests/minute
- **WebSocket**: 1000 messages/minute

## 🔐 Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`