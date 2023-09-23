import { SupabaseClient } from '@supabase/auth-helpers-react'
import { Task, TaskDV, List, PlannedTask, Recurring, Day } from '@/lib/types'
import { date2SqlDateStr, sqlDateStr2Date } from './utils'



export async function getLists({ supabase }: { supabase: SupabaseClient }): Promise<List[]> {
    const { data: lists, error } = await supabase
        .from('lists')
        .select('*')
        .order('order', { ascending: true })

    if (error) {
        console.log('error', error)
        throw error
    }
    return lists;
}
export async function getList({ supabase, listId }: { supabase: SupabaseClient, listId: number }): Promise<List> {
    const { data: list, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return list
}
export async function createList({ supabase, userId, name }: { supabase: SupabaseClient, userId: string, name: string }): Promise<number> {
    const { data: list, error } = await supabase
        .from('lists')
        .insert({ user_id: userId, name, type: 'todo' })
        .select('id')
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return (list as List).id
}
export async function updateList({ supabase, listId, updates }: { supabase: SupabaseClient, listId: number, updates: Partial<List> }): Promise<number> {
    const { data: list, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)
    if (error) {
        console.log('error', error)
        throw error
    }
    return listId
}
export async function deleteList({ supabase, listId }: { supabase: SupabaseClient, listId: number }): Promise<number> {
    const { data: list, error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
    if (error) {
        console.log('error', error)
        throw error
    }
    return listId
}


async function _expandTasks({ supabase, tasks }: { supabase: SupabaseClient, tasks: Task[] }): Promise<TaskDV[]> {

    if (tasks.length === 0) return []

    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const todayStr = date2SqlDateStr(today)
    const tomorrowStr = date2SqlDateStr(tomorrow)

    const task_ids = tasks.map(task => task.id)

    const { data: tasksToday, error: error1 } = await supabase
        .from('planned_tasks')
        .select('*')
        .eq('date', todayStr)
        .in('task_id', task_ids)

    const { data: tasksTomorrow, error: error2 } = await supabase
        .from('planned_tasks')
        .select('*')
        .eq('date', tomorrowStr)
        .in('task_id', task_ids)

    const { data: tasksCompleted, error: error3 } = await supabase
        .from('planned_tasks')
        .select('*')
        .gte('complete_up_to', todayStr)
        .in('task_id', task_ids)

    if (error1) {
        console.log('error1', error1)
        throw error1
    }
    if (error2) {
        console.log('error2', error2)
        throw error2
    }
    if (error3) {
        console.log('error3', error3)
        throw error3
    }

    const tasksDV: TaskDV[] = tasks as TaskDV[]
    tasksDV.forEach(task => {
        task.scheduled_today = tasksToday && tasksToday.some(t => t.task_id === task.id)
        task.scheduled_tomorrow = tasksTomorrow && tasksTomorrow.some(t => t.task_id === task.id)
        const completed_task = tasksCompleted && tasksCompleted.find(t => t.task_id === task.id)
        if (completed_task) {
            task.is_complete = true
            task.completed_at = completed_task.date
            task.completed_until = completed_task.complete_up_to
            task.completed_id = completed_task.id
        }
        else {
            task.is_complete = false
            task.completed_at = null
            task.completed_until = null
            task.completed_id = null
        }
    })
    return tasksDV
}

export function _compareTasks(a: TaskDV, b: TaskDV) {
    if (a.order !== null && b.order !== null) return a.order - b.order
    if (a.order !== null) return -1
    if (b.order !== null) return 1;
    if (a.due_date && b.due_date) return sqlDateStr2Date(a.due_date).getTime() - sqlDateStr2Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return a.id - b.id;
}

export async function getTasks({ supabase, listId }: { supabase: SupabaseClient, listId: number }): Promise<TaskDV[]> {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('list_id', listId)
        .eq('archived', false)

    if (error) {
        console.log('error1', error)
        throw error
    }

    const ret = await _expandTasks({ supabase, tasks });
    return Promise.resolve(ret.sort(_compareTasks))
}
export async function getTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<TaskDV> {
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    const expanded_task = (await _expandTasks({ supabase, tasks: [task] }))[0]
    return Promise.resolve(expanded_task)
}
export async function createTask({ supabase, userId, listId, title, data = {} }: { supabase: SupabaseClient, userId: string, listId: number, title: string, data?: Partial<Task> }): Promise<Partial<Task>> {
    data.user_id = userId
    data.list_id = listId
    data.title = title
    const { data: task, error } = await supabase
        .from('tasks')
        .insert(data)
        .select('id')
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return task.id
}
export async function createAndScheduleTask({ supabase, userId, listId, title, date, recurring }: { supabase: SupabaseClient, userId: string, listId: number, title: string, date: Date, recurring: Recurring }): Promise<number> {

    var due_date = null
    if (recurring !== 'once' && recurring !== 'perpetual') {
        due_date = date2SqlDateStr(date)
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, list_id: listId, title, recurring, due_date })
        .select('id')
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }

    if (!due_date) {
        const dateStr = date2SqlDateStr(date)
        const { data: planned_task, error: error2 } = await supabase
            .from('planned_tasks')
            .insert({ user_id: userId, task_id: (task as Task).id, date: dateStr })
            .single()

        if (error2) {
            console.log('error2', error2)
            throw error2
        }
    }

    return (task as Task).id
}

export async function updateTask({ supabase, taskId, updates }: { supabase: SupabaseClient, taskId: number, updates: Partial<Task> }): Promise<number> {
    const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return taskId
}
export async function deleteTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<Partial<Task>> {
    const { data: task, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select('id, list_id')
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return task
}

export async function completeTask({ supabase, userId, taskId, recurring, dueDate }: { supabase: SupabaseClient, userId: string, taskId: number, recurring: Recurring, dueDate: string | null }): Promise<number> {
    // Look for plannedtask with date = today
    // If it doesnt exist, create it
    // Calculate complete_up_to
    // - once: infinity
    // - perpetual: today
    // - daily/weekly/monthly/yearly: dueDate

    const today = new Date()
    const todayStr = date2SqlDateStr(today)
    var complete_up_to = ""

    switch (recurring) {
        case 'once':
            const future = new Date()
            future.setFullYear(4000)
            complete_up_to = date2SqlDateStr(future)
            break;
        case 'perpetual':
        case 'daily':
            complete_up_to = todayStr
            break;
        case 'weekly':
        case 'monthly':
        case 'yearly':
            if (!dueDate) throw new Error('dueDate must be provided for daily tasks')
            complete_up_to = dueDate
            break;
    }

    // Loog for plannedtask with date = today
    const { data: taskCompleted, error } = await supabase
        .from('planned_tasks')
        .select('*')
        .eq('date', todayStr)
        .eq('task_id', taskId)

    if (error) {
        console.log('error', error)
        throw error
    }

    // If it doesnt exist, create it
    if (taskCompleted.length === 0) {
        const { data: planned_task, error: error2 } = await supabase
            .from('planned_tasks')
            .insert({ user_id: userId, task_id: taskId, date: todayStr, complete_up_to })
            .single()

        if (error2) {
            console.log('error2', error2)
            throw error2
        }

        return taskId
    }

    const { data: planned_task, error: error3 } = await supabase
        .from('planned_tasks')
        .update({ complete_up_to })
        .eq('id', taskCompleted[0].id)
        .single()

    if (error3) {
        console.log('error3', error3)
        throw error3
    }

    return taskId
}

export async function uncompleteTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<number> {
    // Look for plannedtask with complete_up_to >= today - should only be one
    // If found, set complete_up_to to null
    const today = new Date()
    const todayStr = date2SqlDateStr(today)

    const { data: taskCompleted, error } = await supabase
        .from('planned_tasks')
        .update({ complete_up_to: null })
        .gte('complete_up_to', todayStr)
        .eq('task_id', taskId)
        .select('*')
    if (error) {
        console.log('error', error)
        throw error
    }
    if (!taskCompleted) {
        throw new Error(`No task completed for task ${taskId}`)
    }
    return taskId
}
export async function archiveTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<number> {
    const { data: task, error } = await supabase
        .from('tasks')
        .update({ archived: true })
        .eq('id', taskId)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return taskId

}
export async function unarchiveTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<number> {
    const { data: task, error } = await supabase
        .from('tasks')
        .update({ archived: false })
        .eq('id', taskId)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return taskId
}
export async function scheduleTask({ supabase, userId, taskId, date }: { supabase: SupabaseClient, userId: string, taskId: number, date: Date }): Promise<number> {
    // Only allow to schedule tasks that:
    // - are not already scheduled on this date
    // - are not completed past or on this date

    const dateStr = date2SqlDateStr(date)

    const { data: taskCompleted, error } = await supabase
        .from('planned_tasks')
        .select('*')
        .or(`date.eq.${dateStr}, complete_up_to.gte.${dateStr}`)
        .eq('task_id', taskId)

    if (error) {
        console.log('error', error)
        throw error
    }

    if (taskCompleted.length > 0) {
        throw new Error(`Task ${taskId} already completed on or past ${dateStr}`)
    }

    const { data: planned_task, error: error2 } = await supabase
        .from('planned_tasks')
        .insert({ user_id: userId, task_id: taskId, date: dateStr })
        .single()

    if (error2) {
        console.log('error2', error2)
        throw error2
    }

    return taskId
}
export async function unscheduleTask({ supabase, taskId, date }: { supabase: SupabaseClient, taskId: number, date: Date }): Promise<number> {

    const dateStr = date2SqlDateStr(date)

    const { data: planned_task, error } = await supabase
        .from('planned_tasks')
        .delete()
        .eq('task_id', taskId)
        .eq('date', dateStr)
        .single()
    if (error) {
        console.log('error', error)
        throw error
    }
    return taskId

}
export async function rollforwardTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }): Promise<number> {
    // Get task
    // Only rollforward if:
    // - task is not archived
    // - task has a due_date
    // - due_date is in the past
    const today = new Date()
    const todayStr = date2SqlDateStr(today)

    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('archived', false)
        .lt('due_date', todayStr)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }

    if (!task || !task.due_date) {
        throw new Error(`Task ${taskId} not found or has no due date`)
    }

    const due_date = sqlDateStr2Date(task.due_date)
    switch (task.recurring) {
        case 'once':
        case 'perpetual':
            throw new Error(`Task ${taskId} is not recurring`)
        case 'daily':
            while (due_date < today) {
                due_date.setDate(due_date.getDate() + 1);
            }
            break;
        case 'weekly':
            while (due_date < today) {
                due_date.setDate(due_date.getDate() + 7);
            }
            break;
        case 'monthly':
            while (due_date < today) {
                due_date.setMonth(due_date.getMonth() + 1);
            }
            break;
        case 'yearly':
            while (due_date < today) {
                due_date.setFullYear(due_date.getFullYear() + 1);
            }
            break;
        default:
            throw new Error(`Unknown recurring type ${task.recurring}`);
    }

    const due_date_str = date2SqlDateStr(due_date)
    const { data: task2, error: error2 } = await supabase
        .from('tasks')
        .update({ due_date: due_date_str })
        .eq('id', taskId)

    if (error2) {
        console.log('error2', error2)
        throw error2
    }

    return taskId
}




export async function getSchedule({ supabase, date }: { supabase: SupabaseClient, date: Date }): Promise<TaskDV[]> {
    // Gets tasks planned for a given date
    // Gets tasks scheduled for this date
    const dateStr = date2SqlDateStr(date)
    const scheduledP = await supabase
        .from('tasks')
        .select('*,planned_tasks!inner(date)')
        .eq('archived', false)
        .eq('planned_tasks.date', `${dateStr}`)
    const dueP = await supabase
        .from('tasks')
        .select('*')
        .eq('archived', false)
        .eq('due_date', `${dateStr}`)

    const [scheduledResult, dueResult] = await Promise.all([scheduledP, dueP]);

    // Check for errors
    if (scheduledResult.error || dueResult.error) {
        console.error('Error:', scheduledResult.error || dueResult.error);
        throw scheduledResult.error || dueResult.error;
    }

    const scheduledTasks = scheduledResult.data || [];
    const dueTasks = dueResult.data || [];

    const mergedTasks = scheduledTasks.concat(dueTasks);

    const ret = await _expandTasks({ supabase, tasks: mergedTasks });
    return Promise.resolve(ret.sort(_compareTasks))
}
export async function getArchived({ supabase }: { supabase: SupabaseClient }): Promise<TaskDV[]> {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('archived', true)

    if (error) {
        console.log('error', error)
        throw error
    }

    const ret = await _expandTasks({ supabase, tasks });
    return Promise.resolve(ret.sort(_compareTasks))
}