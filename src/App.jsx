import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTasks(data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks. Please check your Supabase configuration.')
    } finally {
      setLoading(false)
    }
  }

  // Create tasks table if it doesn't exist, then fetch tasks
  useEffect(() => {
    const initAndFetch = async () => {
      // Try to create the tasks table
      const { error: tableError } = await supabase.rpc('create_tasks_table_if_not_exists')
      
      // If RPC doesn't work, the table might already exist
      // Let's just try to fetch - if it fails, we'll show an error
      await fetchTasks()
    }
    
    initAndFetch()
  }, [])

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title, is_completed: false }])
        .select()

      if (error) throw error
      
      setTasks([...tasks, ...data])
      setNewTaskTitle('')
    } catch (err) {
      console.error('Error adding task:', err)
      setError('Failed to add task. Make sure the tasks table exists in Supabase.')
    }
  }

  // Toggle task completion
  const toggleTask = async (task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id)

      if (error) throw error

      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
      ))
    } catch (err) {
      console.error('Error updating task:', err)
      setError('Failed to update task')
    }
  }

  // Start editing a task
  const startEdit = (task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  // Save edited task
  const saveEdit = async () => {
    const title = editingTitle.trim()
    if (!title) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title })
        .eq('id', editingTaskId)

      if (error) throw error

      setTasks(tasks.map(t => 
        t.id === editingTaskId ? { ...t, title } : t
      ))
      setEditingTaskId(null)
      setEditingTitle('')
    } catch (err) {
      console.error('Error updating task:', err)
      setError('Failed to update task')
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Error deleting task:', err)
      setError('Failed to delete task')
    }
  }

  // Clear all completed tasks
  const clearCompleted = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('is_completed', true)

      if (error) throw error

      setTasks(tasks.filter(t => !t.is_completed))
    } catch (err) {
      console.error('Error clearing completed tasks:', err)
      setError('Failed to clear completed tasks')
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.is_completed
    if (filter === 'completed') return task.is_completed
    return true
  })

  // Stats
  const activeCount = tasks.filter(t => !t.is_completed).length
  const completedCount = tasks.filter(t => t.is_completed).length

  return (
    <div className="app">
      <header className="header">
        <h1>Task Manager</h1>
        <p>Manage your tasks with Supabase</p>
      </header>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form className="add-task-form" onSubmit={addTask}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button type="submit" disabled={!newTaskTitle.trim()}>
          Add Task
        </button>
      </form>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="task-list">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p>No tasks found</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              {filter === 'all' 
                ? 'Add a new task to get started!' 
                : `No ${filter} tasks`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => (
            <div key={task.id} className="task-item">
              <div
                className={`task-checkbox ${task.is_completed ? 'checked' : ''}`}
                onClick={() => toggleTask(task)}
              />
              <div className="task-content">
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    className="task-title-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    onBlur={saveEdit}
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`task-title ${task.is_completed ? 'completed' : ''}`}
                    onDoubleClick={() => startEdit(task)}
                  >
                    {task.title}
                  </span>
                )}
              </div>
              <div className="task-actions">
                <button 
                  className="action-btn edit-btn"
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {tasks.length > 0 && (
            <div className="stats">
              <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
              {completedCount > 0 && (
                <button className="clear-completed" onClick={clearCompleted}>
                  Clear completed
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
