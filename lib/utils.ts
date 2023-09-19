
import { PlannedTask, TaskDV } from "@/lib/types"

export function isTaskCompleted(task: TaskDV): boolean {
    if (!task) return false

    if (!task.most_recent) return false

    const pt = task.most_recent as PlannedTask
    if (!pt.complete_up_to) return false

    const d = new Date(pt.complete_up_to)
    const today = new Date()
    return d >= today
}

export function dateToSQLDateStr_CST(date: Date): string {
    const cstDateString = date.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const sqlDate = cstDateString.split(',')[0].replace(/\//g, '-');
    return sqlDate
}