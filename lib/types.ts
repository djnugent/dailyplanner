
import { Database } from '@/lib/schema'

export type Task = Database['public']['Tables']['tasks']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type PlannedTask = Database['public']['Tables']['planned_tasks']['Row']
export type Recurring = Database['public']['Enums']['recurring_t']
export type ListType = Database['public']['Enums']['list_type_t']

export enum Day {
    Today = 'Today',
    Tomorrow = 'Tomorrow',
}
export enum ListView {
    Today,
    Tomorrow,
    History,
    Archive
}
/*
- scheduled_today: bool
- scheduled_tomorrow: bool
- is_complete: bool
- completed_at: date | null #date from plannedtask
- completed_until: date | null # completed_up_to from plannedtask
- completed_id: str | null # id from plannedtask
*/
export interface TaskDV extends Task {
    scheduled_today: boolean
    scheduled_tomorrow: boolean
    is_complete: boolean
    completed_at: string | null
    completed_until: string | null
    completed_id: string | null
    planned_task_id: number | null
}