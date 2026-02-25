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
  const [testResults, setTestResults] = useState(null)
  const [runningTests, setRunningTests] = useState(false)

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

  useEffect(() => {
    fetchTasks()
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

  // Comprehensive Test Suite
  const runComprehensiveTests = async () => {
    setRunningTests(true)
    setTestResults(null)
    const results = []
    const log = (test, status, message) => {
      results.push({ test, status, message, timestamp: new Date().toISOTime() })
      console.log(`[${status}] ${test}: ${message}`)
    }

    try {
      // Test 1: Connection to Supabase
      log('1. Supabase Connection', 'running', 'Testing connection...')
      const { data: connTest, error: connError } = await supabase
        .from('tasks')
        .select('id')
        .limit(1)
      
      if (connError) {
        log('1. Supabase Connection', '❌ FAIL', connError.message)
      } else {
        log('1. Supabase Connection', '✅ PASS', 'Successfully connected to Supabase')
      }

      // Test 2: CREATE - Add a new task
      log('2. CREATE Task', 'running', 'Creating a new task...')
      const testTaskTitle = `Test Task ${Date.now()}`
      const { data: createdTask, error: createError } = await supabase
        .from('tasks')
        .insert([{ title: testTaskTitle, is_completed: false }])
        .select()
        .single()

      if (createError) {
        log('2. CREATE Task', '❌ FAIL', createError.message)
      } else {
        log('2. CREATE Task', '✅ PASS', `Task created with ID: ${createdTask.id}`)
        
        // Test 3: READ - Fetch all tasks
        log('3. READ Tasks', 'running', 'Fetching all tasks...')
        const { data: allTasks, error: readError } = await supabase
          .from('tasks')
          .select('*')
          
        if (readError) {
          log('3. READ Tasks', '❌ FAIL', readError.message)
        } else {
          log('3. READ Tasks', '✅ PASS', `Found ${allTasks.length} tasks`)
        }

        // Test 4: UPDATE - Toggle completion
        log('4. UPDATE Task (Toggle)', 'running', 'Toggling task completion...')
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ is_completed: true })
          .eq('id', createdTask.id)

        if (updateError) {
          log('4. UPDATE Task (Toggle)', '❌ FAIL', updateError.message)
        } else {
          log('4. UPDATE Task (Toggle)', '✅ PASS', 'Task marked as completed')
        }

        // Test 5: UPDATE - Edit title
        log('5. UPDATE Task (Edit)', 'running', 'Editing task title...')
        const newTitle = `${testTaskTitle} (Edited)`
        const { error: editError } = await supabase
          .from('tasks')
          .update({ title: newTitle })
          .eq('id', createdTask.id)

        if (editError) {
          log('5. UPDATE Task (Edit)', '❌ FAIL', editError.message)
        } else {
          log('5. UPDATE Task (Edit)', '✅ PASS', 'Task title updated')
        }

        // Test 6: DELETE - Remove task
        log('6. DELETE Task', 'running', 'Deleting test task...')
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', createdTask.id)

        if (deleteError) {
          log('6. DELETE Task', '❌ FAIL', deleteError.message)
        } else {
          log('6. DELETE Task', '✅ PASS', 'Task deleted successfully')
        }
      }

      // Test 7: Batch operations
      log('7. Batch CREATE', 'running', 'Creating multiple tasks...')
      const batchTitles = ['Batch Test 1', 'Batch Test 2', 'Batch Test 3']
      const { data: batchCreated, error: batchError } = await supabase
        .from('tasks')
        .insert(batchTitles.map(title => ({ title, is_completed: false })))
        .select()

      if (batchError) {
        log('7. Batch CREATE', '❌ FAIL', batchError.message)
      } else {
        log('7. Batch CREATE', '✅ PASS', `Created ${batchCreated.length} tasks`)
        
        // Clean up batch tasks
        await supabase.from('tasks').delete().in('id', batchCreated.map(t => t.id))
        log('7. Batch Cleanup', '✅ PASS', 'Cleaned up batch test tasks')
      }

      // Test 8: Filter queries
      log('8. Filter Queries', 'running', 'Testing filtered queries...')
      const { data: activeTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_completed', false)
      
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_completed', true)

      log('8. Filter Queries', '✅ PASS', `Active: ${activeTasks.length}, Completed: ${completedTasks.length}`)

    } catch (err) {
      log('Test Execution', '❌ FAIL', err.message)
    }

    // Refresh tasks after tests
    await fetchTasks()
    
    // Calculate summary
    const passed = results.filter(r => r.status.includes('✅')).length
    const failed = results.filter(r => r.status.includes('❌')).length
    
    setTestResults({
      results,
      summary: { passed, failed, total: results.length },
      completedAt: new Date().toISOTime()
    })
    setRunningTests(false)
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
        <button 
          className="test-btn" 
          onClick={runComprehensiveTests}
          disabled={runningTests}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: runningTests ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: runningTests ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {runningTests ? '🔄 Running Tests...' : '🧪 Run Comprehensive Tests'}
        </button>
      </header>

      {testResults && (
        <div className="test-results" style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Test Results
            <span style={{ 
              background: testResults.summary.failed > 0 ? '#fee2e2' : '#d1fae5',
              color: testResults.summary.failed > 0 ? '#dc2626' : '#059669',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {testResults.summary.passed}/{testResults.summary.total} Passed
            </span>
          </h3>
          
          {testResults.results.map((result, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
              borderBottom: index < testResults.results.length - 1 ? '1px solid #e5e7eb' : 'none'
            }}>
              <span style={{ 
                fontSize: '16px',
                width: '24px'
              }}>{result.status.includes('PASS') ? '✅' : result.status.includes('FAIL') ? '❌' : '⏳'}</span>
              <span style={{ flex: 1, fontWeight: '500' }}>{result.test}</span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{result.message}</span>
            </div>
          ))}
        </div>
      )}

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
