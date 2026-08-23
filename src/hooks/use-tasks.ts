'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskItem, TaskCategory, TaskPriority, TaskHistoryEntry } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchTasks, apiSaveTask, apiDeleteTask } from '@/lib/api-client';
import { useAuth } from './use-auth';

// Seed sample tasks if studio tasks are completely empty
const INITIAL_SEED_TASKS: TaskItem[] = [
  {
    id: 'task-seed-1',
    title: 'Follow up with Photographer for upcoming event',
    category: 'events',
    subCategory: 'Follow up with photographer/videographer',
    quotationNumber: 'SS-2026-001',
    clientName: 'Sarah & Bilal',
    assignedToName: 'Zunair Ahmad (Owner)',
    assignedToUserId: 'user-super-admin',
    startDateTime: new Date(Date.now() - 30 * 60000).toISOString().slice(0, 16),
    deadlineDateTime: new Date(Date.now() + 60 * 60000).toISOString().slice(0, 16),
    priority: 'high',
    notes: 'Verify Sony A7IV lens setup and flash triggers.',
    history: [
      {
        id: 'hist-1',
        timestamp: new Date().toISOString(),
        userId: 'user-super-admin',
        userName: 'Zunair Ahmad (Owner)',
        action: 'Task created',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-seed-2',
    title: 'Send album for designing to design team',
    category: 'albums',
    subCategory: 'Send album for designing',
    assignedToName: 'Staff Photographer',
    assignedToUserId: 'user-staff-1',
    startDateTime: new Date(Date.now() + 120 * 60000).toISOString().slice(0, 16),
    deadlineDateTime: new Date(Date.now() + 360 * 60000).toISOString().slice(0, 16),
    priority: 'medium',
    notes: 'High-res couple portraits shortlisted by client.',
    history: [
      {
        id: 'hist-2',
        timestamp: new Date().toISOString(),
        userId: 'user-super-admin',
        userName: 'Zunair Ahmad (Owner)',
        action: 'Task created',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const local = storage.getTasks();
    if (local.length > 0) return local;
    return INITIAL_SEED_TASKS;
  });
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const syncTasks = useCallback(async () => {
    let local = storage.getTasks();
    if (local.length === 0) {
      storage.setAllTasks(INITIAL_SEED_TASKS);
      local = INITIAL_SEED_TASKS;
    }
    setTasks(local);

    try {
      const cloudTasks = await apiFetchTasks();
      if (Array.isArray(cloudTasks) && cloudTasks.length > 0) {
        storage.setAllTasks(cloudTasks);
        setTasks(cloudTasks);
      }
    } catch (e) {
      console.error('Error syncing tasks with cloud:', e);
    }
  }, []);

  useEffect(() => {
    syncTasks();

    const handleStorage = () => {
      setTasks(storage.getTasks());
    };

    window.addEventListener('snap_tasks_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('snap_tasks_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncTasks]);

  const createTask = async (payload: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Promise<TaskItem> => {
    const taskId = generateSecureId('task');
    const now = new Date().toISOString();

    const historyEntry: TaskHistoryEntry = {
      id: generateSecureId('hist'),
      timestamp: now,
      userId: currentUser?.id || 'user-super-admin',
      userName: currentUser?.name || 'Studio Admin',
      action: 'Task created',
      details: `Created with priority ${payload.priority.toUpperCase()}`,
    };

    const newTask: TaskItem = {
      ...payload,
      id: taskId,
      history: [historyEntry],
      createdAt: now,
      updatedAt: now,
    };

    storage.saveTask(newTask);
    setTasks((prev) => [newTask, ...prev]);

    try {
      await apiSaveTask(newTask);
    } catch (e) {
      console.error('Error saving task to cloud:', e);
    }

    return newTask;
  };

  const updateTask = async (task: TaskItem, changeActionDesc?: string): Promise<TaskItem> => {
    const now = new Date().toISOString();
    const historyEntry: TaskHistoryEntry = {
      id: generateSecureId('hist'),
      timestamp: now,
      userId: currentUser?.id || 'user-super-admin',
      userName: currentUser?.name || 'Studio Admin',
      action: changeActionDesc || 'Task updated',
    };

    const updated: TaskItem = {
      ...task,
      history: [historyEntry, ...(task.history || [])],
      updatedAt: now,
    };

    storage.saveTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

    try {
      await apiSaveTask(updated);
    } catch (e) {
      console.error('Error updating task in cloud:', e);
    }

    return updated;
  };

  const toggleTaskComplete = async (taskId: string): Promise<TaskItem | null> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const isNowCompleted = task.manualStatus !== 'completed';
    const nextManualStatus = isNowCompleted ? 'completed' : 'in_progress';
    const actionDesc = isNowCompleted ? 'Marked task as COMPLETED' : 'Reopened task';

    return await updateTask(
      {
        ...task,
        manualStatus: nextManualStatus,
      },
      actionDesc
    );
  };

  const setTaskWaiting = async (taskId: string, followUpDateTime?: string, reasonNotes?: string): Promise<TaskItem | null> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const updatedTask: TaskItem = {
      ...task,
      manualStatus: 'waiting',
      followUpDateTime: followUpDateTime || task.followUpDateTime,
      notes: reasonNotes ? `${task.notes ? task.notes + '\n\n' : ''}[Waiting Note]: ${reasonNotes}` : task.notes,
    };

    return await updateTask(
      updatedTask,
      `Status changed to WAITING (Follow-up scheduled for ${followUpDateTime || 'TBD'})`
    );
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    storage.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await apiDeleteTask(taskId);
    } catch (e) {
      console.error('Error deleting task from cloud:', e);
    }

    return true;
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    toggleTaskComplete,
    setTaskWaiting,
    deleteTask,
    refreshTasks: syncTasks,
  };
}
