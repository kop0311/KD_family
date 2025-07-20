const cron = require('node-cron');
const { getDatabase } = require('../database/connection');
const logger = require('../utils/logger');

function startCronJobs() {
  cron.schedule('0 8 * * *', async() => {
    logger.info('Running daily task due notifications...');
    await sendTaskDueNotifications();
  });

  cron.schedule('0 0 * * *', async() => {
    logger.info('Running daily recurring task generation...');
    await generateRecurringTasks();
  });

  logger.info('Cron jobs started successfully');
}

async function sendTaskDueNotifications() {
  try {
    const db = await getDatabase();
    const config = await db.db.query(
      'SELECT config_value FROM system_config WHERE config_key = "notification_task_due_hours"'
    );

    const hoursBeforeDue = parseInt(config[0]?.config_value || '24');

    const dueTasks = await db.db.query(`
      SELECT t.id, t.title, t.assigned_to, u.full_name
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.status IN ('pending', 'claimed', 'in_progress')
        AND t.due_date IS NOT NULL
        AND t.due_date <= DATE_ADD(NOW(), INTERVAL ? HOUR)
        AND t.due_date > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.user_id = t.assigned_to 
            AND n.title = 'Task Due Soon' 
            AND n.message LIKE CONCAT('%', t.title, '%')
            AND n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        )
    `, [hoursBeforeDue]);

    for (const task of dueTasks) {
      await db.db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [
        task.assigned_to,
        'Task Due Soon',
        `Your task "${task.title}" is due soon. Please complete it on time.`,
        'task_due'
      ]);
    }

    logger.info(`Sent ${dueTasks.length} task due notifications`);
  } catch (error) {
    logger.error('Error sending task due notifications:', error);
  }
}

async function generateRecurringTasks() {
  try {
    const db = await getDatabase();
    const recurringTasks = await db.db.query(`
      SELECT t.*, tt.code as task_type_code
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      WHERE t.is_recurring = TRUE 
        AND t.recurrence_pattern IS NOT NULL
        AND t.status = 'approved'
    `);

    const today = new Date();
    let createdCount = 0;

    for (const task of recurringTasks) {
      let shouldCreate = false;
      const newDueDate = new Date(today);

      switch (task.recurrence_pattern) {
      case 'daily':
        shouldCreate = true;
        newDueDate.setDate(today.getDate() + 1);
        break;
      case 'weekly':
        if (today.getDay() === new Date(task.created_at).getDay()) {
          shouldCreate = true;
          newDueDate.setDate(today.getDate() + 7);
        }
        break;
      case 'monthly':
        if (today.getDate() === new Date(task.created_at).getDate()) {
          shouldCreate = true;
          newDueDate.setMonth(today.getMonth() + 1);
        }
        break;
      }

      if (shouldCreate) {
        const existingTask = await db.db.query(`
          SELECT id FROM tasks 
          WHERE title = ? 
            AND assigned_to = ? 
            AND due_date = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `, [task.title, task.assigned_to, newDueDate.toISOString().split('T')[0]]);

        if (existingTask.length === 0) {
          await db.db.query(`
            INSERT INTO tasks (
              title, description, task_type_id, assigned_to, created_by, 
              points, due_date, is_recurring, recurrence_pattern, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `, [
            task.title,
            task.description,
            task.task_type_id,
            task.assigned_to,
            task.created_by,
            task.points,
            newDueDate.toISOString().split('T')[0],
            true,
            task.recurrence_pattern
          ]);

          if (task.assigned_to) {
            await db.db.query(`
              INSERT INTO notifications (user_id, title, message, type)
              VALUES (?, ?, ?, ?)
            `, [
              task.assigned_to,
              'New Recurring Task',
              `A new ${task.recurrence_pattern} task "${task.title}" has been created for you.`,
              'system'
            ]);
          }

          createdCount++;
        }
      }
    }

    logger.info(`Generated ${createdCount} recurring tasks`);
  } catch (error) {
    logger.error('Error generating recurring tasks:', error);
  }
}

module.exports = {
  startCronJobs,
  sendTaskDueNotifications,
  generateRecurringTasks
};
