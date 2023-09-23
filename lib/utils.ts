
import { PlannedTask, TaskDV } from "@/lib/types"

export function date2SqlDateStr(date: Date) {
    const str = date.toLocaleDateString('en-US');
    const [month, day, year] = str.split('/');
    return `${year}-${month}-${day}`;
}

export function sqlDateStr2Date(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date
}