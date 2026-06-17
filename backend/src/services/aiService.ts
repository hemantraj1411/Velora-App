// Replace the entire file with GROQ implementation
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const aiService = {
  async getAssistance(prompt: string): Promise<string[]> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are Velora AI, a productivity assistant. Provide helpful, actionable suggestions for task management and productivity. Keep responses concise and practical.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '';
      return response.split('\n').filter(s => s.trim().length > 0);
    } catch (error) {
      console.error('GROQ API error:', error);
      return [
        'Unable to process request at the moment.',
        'Please try again later.',
        'Here are some productivity tips: Break tasks into smaller steps, prioritize important work, take regular breaks.'
      ];
    }
  },

  async prioritizeTasks(tasks: any[]): Promise<any[]> {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a task prioritization expert. Analyze tasks and return them in priority order as a JSON array. Each task should have: id, title, priority (high/medium/low), reason, suggestedTime, order.',
          },
          {
            role: 'user',
            content: JSON.stringify(tasks.map(t => ({ 
              id: t._id || t.id,
              title: t.title, 
              dueDate: t.dueDate, 
              priority: t.priority,
              description: t.description 
            }))),
          },
        ],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.3,
        max_tokens: 1000,
      });

      const result = completion.choices[0]?.message?.content || '[]';
      // Clean the response to extract JSON
      let cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(cleanResult);
      return Array.isArray(parsed) ? parsed : tasks;
    } catch (error) {
      console.error('Priority error:', error);
      return tasks;
    }
  },

  async processVoiceCommand(text: string): Promise<any> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a voice command processor. Extract task information from the user's speech.
            Return a JSON object with:
            {
              "type": "task",
              "task": {
                "title": "extracted title",
                "dueDate": "YYYY-MM-DD or null",
                "dueTime": "HH:MM or null",
                "priority": "high/medium/low",
                "category": "work/study/personal/health"
              }
            }`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = completion.choices[0]?.message?.content || '{}';
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('Voice command error:', error);
      const lowerText = text.toLowerCase();
      const result: any = { originalText: text, type: 'task' };
      
      // Fallback parsing
      if (lowerText.includes('remind me to') || lowerText.includes('task')) {
        let title = text.replace(/remind me to|task:/gi, '').trim();
        let dueDate = null;
        
        if (lowerText.includes('tomorrow')) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
          title = title.replace(/tomorrow/gi, '').trim();
        } else if (lowerText.includes('today')) {
          dueDate = new Date();
          title = title.replace(/today/gi, '').trim();
        }

        result.task = { title, dueDate: dueDate?.toISOString().split('T')[0] || null };
      }
      
      return result;
    }
  },

  async generateDailySchedule(tasks: any[], habits: any[]): Promise<any> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Create a daily schedule based on tasks and habits.
            Return as JSON:
            {
              "morning": ["task1", "task2"],
              "afternoon": ["task3", "task4"],
              "evening": ["task5", "task6"],
              "tips": ["tip1", "tip2"]
            }`,
          },
          {
            role: 'user',
            content: `Tasks: ${JSON.stringify(tasks.map(t => t.title))}\nHabits: ${JSON.stringify(habits.map(h => h.name))}`,
          },
        ],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.5,
        max_tokens: 800,
      });

      const result = completion.choices[0]?.message?.content || '{}';
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('Schedule generation error:', error);
      return {
        morning: ['Review your tasks for the day', 'Complete high-priority tasks'],
        afternoon: ['Focus on deep work', 'Take short breaks between tasks'],
        evening: ['Review completed tasks', 'Plan for tomorrow'],
        tips: ['Stay hydrated', 'Take breaks every 90 minutes', 'Celebrate small wins']
      };
    }
  },

  async getProductivityTips(completedTasks: number, pendingTasks: number): Promise<string[]> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a productivity expert. Provide 3 specific, actionable productivity tips based on the user\'s task completion data. Return as JSON array of strings.',
          },
          {
            role: 'user',
            content: `Completed: ${completedTasks} tasks, Pending: ${pendingTasks} tasks`,
          },
        ],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 300,
      });

      const result = completion.choices[0]?.message?.content || '[]';
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const tips = JSON.parse(cleanResult);
      return Array.isArray(tips) ? tips : [
        'Break large tasks into smaller chunks',
        'Use the Pomodoro technique (25 min work, 5 min break)',
        'Eliminate distractions during focus time'
      ];
    } catch (error) {
      console.error('Tips generation error:', error);
      return [
        'Break large tasks into smaller chunks',
        'Use the Pomodoro technique (25 min work, 5 min break)',
        'Eliminate distractions during focus time'
      ];
    }
  },
};