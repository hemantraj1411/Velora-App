import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { User } from '../models/User';

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error('Groq error:', error.message);
    return "I'm having trouble connecting right now. Please try again.";
  }
}

export const chatWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    console.log('User message:', message);
    console.log('Using model:', MODEL);

    // Get user context for personalized responses
    const recentTasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    const userStats = await User.findById(req.user._id);

    const systemPrompt = `You are Velora AI, a friendly and helpful productivity assistant. 

User Information:
- Name: ${req.user.name}
- Current streak: ${userStats?.stats.currentStreak || 0} days
- Total tasks completed: ${userStats?.stats.completedTasks || 0}
- Recent tasks: ${recentTasks.map(t => t.title).join(', ') || 'No tasks yet'}

Guidelines:
- Keep responses concise (under 150 words)
- Be helpful and encouraging
- Focus on productivity, task management, and goal setting
- Be conversational and friendly`;

    const response = await callGroq(message, systemPrompt);

    res.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
};

export const generateStudyPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examName, daysLeft, hoursPerDay, subjects } = req.body;

    if (!examName || !daysLeft || !hoursPerDay) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const systemPrompt = "You are an expert study planner. Create practical, achievable study plans.";
    const prompt = `Create a ${daysLeft}-day study plan for ${examName} (${hoursPerDay} hours/day)${subjects ? ` covering ${subjects}` : ''}. 
    Include daily topics, revision schedule, and practice recommendations. Be specific and practical.`;

    const plan = await callGroq(prompt, systemPrompt);

    res.json({
      success: true,
      plan: plan,
    });
  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
};

export const planMyDay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'pending' }).limit(5);

    if (tasks.length === 0) {
      res.json({
        schedule: "No pending tasks! Great job! 🎉 Would you like to add some goals for today?",
        taskCount: 0,
      });
      return;
    }

    const systemPrompt = "You are a scheduling assistant. Create realistic, time-blocked daily schedules.";
    const prompt = `Create a realistic daily schedule for these tasks: ${tasks.map(t => t.title).join(', ')}. 
    Include time slots and breaks. Keep it practical.`;

    const schedule = await callGroq(prompt, systemPrompt);

    res.json({
      success: true,
      schedule: schedule,
      taskCount: tasks.length,
    });
  } catch (error) {
    console.error('Plan my day error:', error);
    res.status(500).json({ error: 'Failed to plan your day' });
  }
};

export const prioritizeTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'pending' });

    if (tasks.length === 0) {
      res.json({
        tasks: [],
        recommendations: ["No pending tasks. Time to relax or plan ahead!"],
      });
      return;
    }

    const systemPrompt = "You are a task prioritization expert.";
    const prompt = `Analyze these tasks and provide 2-3 recommendations for prioritization:
    ${tasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (Priority: ${t.priority})`).join('\n')}`;

    const aiResponse = await callGroq(prompt, systemPrompt);

    res.json({
      tasks: tasks,
      recommendations: aiResponse ? [aiResponse] : [
        "Focus on high-priority tasks first",
        "Break large tasks into smaller steps",
        "Set deadlines for each task",
      ],
      totalPending: tasks.length,
    });
  } catch (error) {
    console.error('Prioritize tasks error:', error);
    res.status(500).json({ error: 'Failed to prioritize tasks' });
  }
};

export const getSmartSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'pending' });
    
    const suggestions = [];

    if (tasks.length > 5) {
      suggestions.push({
        type: 'task',
        message: `You have ${tasks.length} pending tasks. Try the 2-minute rule for small ones!`,
        action: 'Review tasks',
        priority: 'high',
      });
    }

    suggestions.push({
      type: 'tip',
      message: 'Try the Pomodoro Technique: 25 minutes work, 5 minutes break. It improves focus!',
      action: 'Try it',
      priority: 'low',
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Smart suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

export const voiceCommand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { command } = req.body;

    if (!command) {
      res.status(400).json({ error: 'Voice command is required' });
      return;
    }

    const task = new Task({
      title: command.substring(0, 100),
      description: `Created via voice command: ${command}`,
      priority: 'medium',
      category: 'Personal',
      userId: req.user._id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    await task.save();

    res.json({
      success: true,
      message: 'Task created from voice command',
      task,
    });
  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({ error: 'Failed to process voice command' });
  }
};