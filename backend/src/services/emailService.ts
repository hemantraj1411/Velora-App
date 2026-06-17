import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Welcome to Velora, ${name}! 🎉</h1>
      <p>We're excited to have you on board. Velora is your AI-powered productivity companion.</p>
      <h2>Getting Started:</h2>
      <ul>
        <li>Create your first task</li>
        <li>Set up your habits</li>
        <li>Explore AI features</li>
        <li>Track your progress</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/dashboard" 
         style="background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Go to Dashboard
      </a>
      <p style="margin-top: 20px; color: #666;">Stay productive!<br>The Velora Team</p>
    </div>
  `;
  
  await sendEmail(email, 'Welcome to Velora!', html);
};

export const sendDailyDigest = async (email: string, tasks: any[]): Promise<void> => {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Your Daily Digest 📊</h1>
      <p>Here's your productivity summary:</p>
      <ul>
        <li>✅ Completed: ${completedTasks.length} tasks</li>
        <li>⏳ Pending: ${pendingTasks.length} tasks</li>
      </ul>
      <h2>Today's Pending Tasks:</h2>
      <ul>
        ${pendingTasks.map(task => `<li>${task.title} - ${task.priority} priority</li>`).join('')}
      </ul>
      <a href="${process.env.FRONTEND_URL}/dashboard" 
         style="background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Dashboard
      </a>
    </div>
  `;
  
  await sendEmail(email, 'Your Daily Productivity Report', html);
};

export const sendReminderEmail = async (email: string, task: any): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Task Reminder ⏰</h1>
      <p>Don't forget about your task:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
        <h3>${task.title}</h3>
        <p>${task.description || 'No description'}</p>
        <p>Priority: ${task.priority}</p>
        <p>Due: ${new Date(task.dueDate).toLocaleString()}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard" 
         style="background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
        Complete Task
      </a>
    </div>
  `;
  
  await sendEmail(email, `Reminder: ${task.title}`, html);
};