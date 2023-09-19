
import { Database } from '@/lib/schema'

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskDV = Database['public']['Views']['tasks_detail_view']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type PlannedTask = Database['public']['Tables']['plannedtask']['Row']
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