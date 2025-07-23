use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub username: String,
    pub email: String,
    pub role: String,
    pub points: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub points: i32,
    pub assigned_to: Option<u32>,
    pub completed: bool,
}

pub struct Database {
    users: HashMap<u32, User>,
    tasks: HashMap<u32, Task>,
    next_user_id: u32,
    next_task_id: u32,
}

impl Database {
    pub fn new() -> Self {
        Database {
            users: HashMap::new(),
            tasks: HashMap::new(),
            next_user_id: 1,
            next_task_id: 1,
        }
    }

    pub fn create_user(&mut self, username: String, email: String, role: String) -> Result<User, String> {
        if username.is_empty() {
            return Err("Username cannot be empty".to_string());
        }
        
        if email.is_empty() || !email.contains('@') {
            return Err("Invalid email address".to_string());
        }

        let user = User {
            id: self.next_user_id,
            username,
            email,
            role,
            points: 0,
        };

        self.users.insert(self.next_user_id, user.clone());
        self.next_user_id += 1;
        Ok(user)
    }

    pub fn get_user(&self, id: u32) -> Option<&User> {
        self.users.get(&id)
    }

    pub fn create_task(&mut self, title: String, description: String, points: i32) -> Result<Task, String> {
        if title.is_empty() {
            return Err("Task title cannot be empty".to_string());
        }

        if points < 0 {
            return Err("Task points cannot be negative".to_string());
        }

        let task = Task {
            id: self.next_task_id,
            title,
            description,
            points,
            assigned_to: None,
            completed: false,
        };

        self.tasks.insert(self.next_task_id, task.clone());
        self.next_task_id += 1;
        Ok(task)
    }

    pub fn assign_task(&mut self, task_id: u32, user_id: u32) -> Result<(), String> {
        if !self.users.contains_key(&user_id) {
            return Err("User not found".to_string());
        }

        if let Some(task) = self.tasks.get_mut(&task_id) {
            task.assigned_to = Some(user_id);
            Ok(())
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn complete_task(&mut self, task_id: u32) -> Result<(), String> {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            if task.completed {
                return Err("Task is already completed".to_string());
            }
            
            task.completed = true;
            
            // Award points to the assigned user
            if let Some(user_id) = task.assigned_to {
                if let Some(user) = self.users.get_mut(&user_id) {
                    user.points += task.points;
                }
            }
            
            Ok(())
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn get_leaderboard(&self) -> Vec<&User> {
        let mut users: Vec<&User> = self.users.values().collect();
        users.sort_by(|a, b| b.points.cmp(&a.points));
        users
    }
}

fn main() {
    println!("KD Family Backend Server");
    println!("This is a placeholder main function for the Rust backend.");
    println!("In a real implementation, this would start the web server.");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user_success() {
        let mut db = Database::new();
        let result = db.create_user(
            "john_doe".to_string(),
            "john@example.com".to_string(),
            "child".to_string(),
        );

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "john_doe");
        assert_eq!(user.email, "john@example.com");
        assert_eq!(user.role, "child");
        assert_eq!(user.points, 0);
        assert_eq!(user.id, 1);
    }

    #[test]
    fn test_create_user_empty_username() {
        let mut db = Database::new();
        let result = db.create_user(
            "".to_string(),
            "john@example.com".to_string(),
            "child".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Username cannot be empty");
    }

    #[test]
    fn test_create_user_invalid_email() {
        let mut db = Database::new();
        let result = db.create_user(
            "john_doe".to_string(),
            "invalid-email".to_string(),
            "child".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid email address");
    }

    #[test]
    fn test_create_task_success() {
        let mut db = Database::new();
        let result = db.create_task(
            "Clean room".to_string(),
            "Clean and organize bedroom".to_string(),
            10,
        );

        assert!(result.is_ok());
        let task = result.unwrap();
        assert_eq!(task.title, "Clean room");
        assert_eq!(task.description, "Clean and organize bedroom");
        assert_eq!(task.points, 10);
        assert_eq!(task.id, 1);
        assert!(!task.completed);
        assert!(task.assigned_to.is_none());
    }

    #[test]
    fn test_create_task_empty_title() {
        let mut db = Database::new();
        let result = db.create_task(
            "".to_string(),
            "Some description".to_string(),
            10,
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Task title cannot be empty");
    }

    #[test]
    fn test_create_task_negative_points() {
        let mut db = Database::new();
        let result = db.create_task(
            "Clean room".to_string(),
            "Clean and organize bedroom".to_string(),
            -5,
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Task points cannot be negative");
    }

    #[test]
    fn test_assign_task_success() {
        let mut db = Database::new();
        
        // Create user and task
        let user = db.create_user("john".to_string(), "john@example.com".to_string(), "child".to_string()).unwrap();
        let task = db.create_task("Clean room".to_string(), "Description".to_string(), 10).unwrap();
        
        // Assign task
        let result = db.assign_task(task.id, user.id);
        assert!(result.is_ok());
        
        // Verify assignment
        let assigned_task = db.tasks.get(&task.id).unwrap();
        assert_eq!(assigned_task.assigned_to, Some(user.id));
    }

    #[test]
    fn test_assign_task_user_not_found() {
        let mut db = Database::new();
        let task = db.create_task("Clean room".to_string(), "Description".to_string(), 10).unwrap();
        
        let result = db.assign_task(task.id, 999);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "User not found");
    }

    #[test]
    fn test_complete_task_success() {
        let mut db = Database::new();
        
        // Create user and task
        let user = db.create_user("john".to_string(), "john@example.com".to_string(), "child".to_string()).unwrap();
        let task = db.create_task("Clean room".to_string(), "Description".to_string(), 10).unwrap();
        
        // Assign and complete task
        db.assign_task(task.id, user.id).unwrap();
        let result = db.complete_task(task.id);
        
        assert!(result.is_ok());
        
        // Verify task completion and points awarded
        let completed_task = db.tasks.get(&task.id).unwrap();
        assert!(completed_task.completed);
        
        let updated_user = db.users.get(&user.id).unwrap();
        assert_eq!(updated_user.points, 10);
    }

    #[test]
    fn test_complete_task_already_completed() {
        let mut db = Database::new();
        let task = db.create_task("Clean room".to_string(), "Description".to_string(), 10).unwrap();
        
        // Complete task twice
        db.complete_task(task.id).unwrap();
        let result = db.complete_task(task.id);
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Task is already completed");
    }

    #[test]
    fn test_leaderboard() {
        let mut db = Database::new();
        
        // Create users
        let user1 = db.create_user("alice".to_string(), "alice@example.com".to_string(), "child".to_string()).unwrap();
        let user2 = db.create_user("bob".to_string(), "bob@example.com".to_string(), "child".to_string()).unwrap();
        
        // Give different points
        db.users.get_mut(&user1.id).unwrap().points = 20;
        db.users.get_mut(&user2.id).unwrap().points = 30;
        
        let leaderboard = db.get_leaderboard();
        
        assert_eq!(leaderboard.len(), 2);
        assert_eq!(leaderboard[0].username, "bob"); // Higher points first
        assert_eq!(leaderboard[1].username, "alice");
    }
}
