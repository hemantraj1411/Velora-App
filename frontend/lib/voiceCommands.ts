import { api } from "./api";

interface VoiceTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
  dueTime: string;
  estimatedTime: number;
}

export const processVoiceCommand = async (command: string): Promise<VoiceTask | null> => {
  const lowerCommand = command.toLowerCase();
  
  // Try to use AI for better parsing if available
  try {
    const response = await api.post("/ai/voice-command", { command });
    if (response.data.task) {
      return response.data.task;
    }
  } catch (error) {
    console.log("AI parsing failed, using local parsing");
  }
  
  // Fallback to local parsing
  return parseCommandLocally(command);
};

const parseCommandLocally = (command: string): VoiceTask => {
  const lowerCommand = command.toLowerCase();
  
  // Extract title
  let title = command;
  const removePrefixes = [
    "remind me to", "add task", "create task", "new task", 
    "i need to", "please", "can you", "could you"
  ];
  removePrefixes.forEach(prefix => {
    if (lowerCommand.startsWith(prefix)) {
      title = command.slice(prefix.length).trim();
    }
  });
  
  // Detect priority
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (lowerCommand.includes("urgent") || lowerCommand.includes("important") || 
      lowerCommand.includes("asap") || lowerCommand.includes("critical")) {
    priority = 'high';
  } else if (lowerCommand.includes("someday") || lowerCommand.includes("when possible") || 
             lowerCommand.includes("not urgent")) {
    priority = 'low';
  }
  
  // Detect due date
  let dueDate = new Date();
  if (lowerCommand.includes("tomorrow")) {
    dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (lowerCommand.includes("next week")) {
    dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (lowerCommand.includes("next month")) {
    dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else if (lowerCommand.includes("today")) {
    dueDate = new Date();
  } else {
    dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  }
  
  // Detect category
  let category = "Personal";
  if (lowerCommand.includes("work") || lowerCommand.includes("meeting") || 
      lowerCommand.includes("project") || lowerCommand.includes("deadline")) {
    category = "Work";
  } else if (lowerCommand.includes("study") || lowerCommand.includes("learn") || 
             lowerCommand.includes("exam") || lowerCommand.includes("homework")) {
    category = "Study";
  } else if (lowerCommand.includes("health") || lowerCommand.includes("gym") || 
             lowerCommand.includes("exercise") || lowerCommand.includes("workout")) {
    category = "Health";
  } else if (lowerCommand.includes("shopping") || lowerCommand.includes("buy") || 
             lowerCommand.includes("purchase")) {
    category = "Shopping";
  } else if (lowerCommand.includes("family") || lowerCommand.includes("home") || 
             lowerCommand.includes("house")) {
    category = "Family";
  } else if (lowerCommand.includes("finance") || lowerCommand.includes("bill") || 
             lowerCommand.includes("payment") || lowerCommand.includes("bank")) {
    category = "Finance";
  }
  
  // Capitalize first letter of title
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  return {
    title: title,
    description: `Created via voice command: "${command}"`,
    priority,
    category,
    dueDate: dueDate.toISOString().split('T')[0],
    dueTime: "12:00",
    estimatedTime: 30,
  };
};

// Example voice commands that work:
// "Remind me to call John tomorrow"
// "Add urgent task finish project report by Friday"
// "Create task buy groceries for the week"
// "I need to schedule a meeting with the team next week"