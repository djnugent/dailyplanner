import { Database } from '@/lib/schema'
import { SupabaseClient } from '@supabase/auth-helpers-react'
import { Task, TaskDV, List, PlannedTask, Recurring, Day } from '@/lib/types'

export async function fetchLists({ supabase }: { supabase: SupabaseClient }): Promise<List[]> {
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

export async function fetchList({ supabase, listID }: { supabase: SupabaseClient<Database>, listID: number }): Promise<List> {
    const { data: list, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return list;
}

export async function createList({ supabase, userID, name }: { supabase: SupabaseClient<Database>, userID: string, name: string }): Promise<List> {
    const { data: list, error } = await supabase
        .from('lists')
        .insert({ user_id: userID, name, type: 'todo' })
        .select()
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return list;
}

export async function updateList({ supabase, listID, updates }: { supabase: SupabaseClient<Database>, listID: number, updates: Partial<List> }): Promise<List> {
    const { data: list, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return list;
}

export async function deleteList({ supabase, listID }: { supabase: SupabaseClient<Database>, listID: number }): Promise<void> {
    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
}

export async function fetchTasks({ supabase, listID }: { supabase: SupabaseClient<Database>, listID: number }): Promise<TaskDV[]> {
    const { data: tasks, error } = await supabase
        .from('tasks_detail_view')
        .select('*')
        .eq('list_id', listID)
        .eq('archived', false)

    if (error) {
        console.log('error', error)
        throw error
    }
    return tasks;
}

export async function fetchTask({ supabase, taskID }: { supabase: SupabaseClient<Database>, taskID: number }): Promise<TaskDV> {
    const { data: task, error } = await supabase
        .from('tasks_detail_view')
        .select('*')
        .eq('id', taskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return task;
}

export async function createTask({ supabase, userID, listID, text, recurring = null }: { supabase: SupabaseClient<Database>, userID: string, listID: number, text: string, recurring?: Recurring | null }): Promise<Task> {
    const { data: task, error } = await supabase
        .from('tasks')
        .insert({ user_id: userID, list_id: listID, text, recurring })
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return task;
}

export async function updateTask({ supabase, taskID, updates }: { supabase: SupabaseClient<Database>, taskID: number, updates: Partial<Task> }): Promise<Task> {
    const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return task;
}

export async function deleteTask({ supabase, taskID }: { supabase: SupabaseClient<Database>, taskID: number }): Promise<Task> {
    const { data: task, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return task;
}

export async function fetchPlannedTasks({ supabase }: { supabase: SupabaseClient<Database> }): Promise<TaskDV[]> {
    const { data: plannedTasks, error } = await supabase
        .from('plannedtask_detail_view')
        .select('*')

    if (error) {
        console.log('error', error)
        throw error
    }
    return plannedTasks;
}

export async function fetchPlannedTasksByDate({ supabase, date }: { supabase: SupabaseClient<Database>, date: string }): Promise<TaskDV[]> {
    const { data: plannedTasks, error } = await supabase
        .from('plannedtask_detail_view')
        .select('*')
        .eq('date', date)

    if (error) {
        console.log('error', error)
        throw error
    }
    return plannedTasks;
}

export async function fetchPlannedTask({ supabase, plannedTaskID }: { supabase: SupabaseClient<Database>, plannedTaskID: number }): Promise<TaskDV> {
    const { data: plannedTask, error } = await supabase
        .from('plannedtask_detail_view')
        .select('*')
        .eq('id', plannedTaskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return plannedTask;
}

export async function createPlannedTask({ supabase, userID, taskID, date, completeUpTo = null }: { supabase: SupabaseClient<Database>, userID: string, taskID: number, date: string, completeUpTo: string | null }): Promise<PlannedTask> {
    const { data: plannedTask, error } = await supabase
        .from('plannedtask')
        .insert({ user_id: userID, task_id: taskID, date, complete_up_to: completeUpTo })
        .select()
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return plannedTask;
}

export async function deletePlannedTask({ supabase, plannedTaskID }: { supabase: SupabaseClient<Database>, plannedTaskID: number }): Promise<void> {
    const { error } = await supabase
        .from('plannedtask')
        .delete()
        .eq('id', plannedTaskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
}

export async function updatePlannedTask({ supabase, plannedTaskID, updates }: { supabase: SupabaseClient<Database>, plannedTaskID: number, updates: Partial<PlannedTask> }): Promise<PlannedTask> {
    const { data: plannedTask, error } = await supabase
        .from('plannedtask')
        .update(updates)
        .eq('id', plannedTaskID)
        .single()

    if (error) {
        console.log('error', error)
        throw error
    }
    return plannedTask;
}

export async function fetchMyDayTasks({ supabase, day }: { supabase: SupabaseClient<Database>, day: Day }): Promise<TaskDV[]> {

    if (day === Day.Today) {
        const { data: myDayTasks, error } = await supabase
            .from('tasks_detail_view')
            .select('*')
            .not('today', 'is', null)
            .eq('archived', false)
        return myDayTasks;

    } else if (day === Day.Tomorrow) {
        const { data: myDayTasks, error } = await supabase
            .from('tasks_detail_view')
            .select('*')
            .not('tomorrow', 'is', null)
            .eq('archived', false)
        return myDayTasks;

    } else {
        throw new Error('Invalid day')
    }
}

export async function fetchArchivedTasks({ supabase }: { supabase: SupabaseClient<Database> }): Promise<TaskDV[]> {
    const { data: archivedTasks, error } = await supabase
        .from('tasks_detail_view')
        .select('*')
        .eq('archived', true)

    if (error) {
        console.log('error', error)
        throw error
    }
    return archivedTasks;
}
