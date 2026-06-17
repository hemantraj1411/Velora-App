import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Note } from '../models/Note';
import { Task } from '../models/Task';

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const noteData = {
      ...req.body,
      userId: req.user._id,
    };

    const note = new Note(noteData);
    await note.save();

    res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
};

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { folder, search, page = 1, limit = 20 } = req.query;
    const query: any = { userId: req.user._id };
    
    if (folder) query.folder = folder;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

export const getNoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

export const summarizeNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Simple summarization (can be enhanced with AI)
    const sentences = note.content.split(/[.!?]+/);
    const summary = sentences.slice(0, 3).join('. ') + '.';

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize note' });
  }
};

export const generateActionItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Extract potential action items from content
    const actionKeywords = ['need to', 'should', 'must', 'have to', 'important to'];
    const sentences = note.content.split(/[.!?]+/);
    const actionItems = sentences.filter(sentence =>
      actionKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );

    res.json({ actionItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate action items' });
  }
};

export const convertToTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const task = new Task({
      userId: req.user._id,
      title: note.title,
      description: note.content.substring(0, 500),
      priority: 'medium',
      category: 'Personal',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await task.save();

    res.json({
      message: 'Note converted to task successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert note to task' });
  }
};

export const getNoteFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folders = await Note.distinct('folder', { userId: req.user._id });
    res.json({ folders: folders.filter(f => f) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};