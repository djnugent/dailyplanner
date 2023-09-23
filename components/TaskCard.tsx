import { Database } from '@/lib/schema'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { use, useEffect, useState } from 'react'
import { TaskModal } from '@/components/TaskModal'
import { useMutation, useQueryClient, useQuery } from "react-query";
import { RecurringIcon } from './RecurringIcon'
import { TaskDV } from '@/lib/types'
import { useGetList, useGetTask, useCompleteTask, useUncompleteTask, useScheduleTask, useUnscheduleTask } from '@/lib/query';
import { date2SqlDateStr, sqlDateStr2Date } from '@/lib/utils';

export function TaskCard({ task, disableCheckbox = false }: { task: TaskDV, disableCheckbox?: boolean }) {
    const session = useSession()
    const queryClient = useQueryClient();
    const supabase = useSupabaseClient<Database>()
    const [errorText, setErrorText] = useState('')
    const [editTaskId, setEditTaskId] = useState<number | null>(null)
    const [taskDateStr, setTaskDateStr] = useState<string | null>(null)
    const [listName, setListName] = useState<string | null>(null)
    const [disbleScheduleToday, setDisableScheduleToday] = useState(false)
    const [disbleScheduleTomorrow, setDisableScheduleTomorrow] = useState(false)

    const { status, data: list, error } = useGetList({ supabase, listId: task.list_id });
    const { mutate: completeTask } = useCompleteTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: uncompleteTask } = useUncompleteTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: scheduleTask } = useScheduleTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: unscheduleTask } = useUnscheduleTask({ supabase, queryClient, userId: session?.user?.id });

    const user = session?.user

    useEffect(() => {
        const populateTaskDateStr = async () => {
            if (task.due_date) {
                const d = sqlDateStr2Date(task.due_date)
                const today = new Date()
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                if (d.toDateString() === today.toDateString()) {
                    setTaskDateStr('Today')
                }
                else if (d.toDateString() === tomorrow.toDateString()) {
                    setTaskDateStr('Tomorrow')
                }
                else {
                    setTaskDateStr(d.toDateString())
                }
            }
            else {
                setTaskDateStr(null)
            }
        }
        populateTaskDateStr();
    }, [task.due_date])

    useEffect(() => {
        if (list) setListName(list.name)
    }, [list])


    useEffect(() => {
        const today = new Date()
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const todayStr = date2SqlDateStr(today)
        const tomorrowStr = date2SqlDateStr(tomorrow)
        setDisableScheduleToday(task.is_complete && task.completed_until == todayStr && !task.scheduled_today)
        setDisableScheduleTomorrow(task.is_complete && task.completed_until == tomorrowStr && !task.scheduled_tomorrow)
    }, [task])

    const toggle = async () => {
        if (task.is_complete) {
            await handleUncompleteTask()
        }
        else {
            await handleCompleteTask()
        }
    }

    const handleAddToToday = async () => {
        if (!user || !task || !task.id) return
        const today = new Date()
        await scheduleTask({ taskId: task.id, date: today })
    }

    const handleAddToTomorrow = async () => {
        if (!user || !task || !task.id) return
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await scheduleTask({ taskId: task.id, date: tomorrow })
    }

    const handleRemoveFromToday = async () => {
        if (!user || !task.scheduled_today) return
        const today = new Date()
        await unscheduleTask({ taskId: task.id, date: today })
    }

    const handleRemoveFromTomorrow = async () => {
        if (!user || !task.scheduled_tomorrow) return
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await unscheduleTask({ taskId: task.id, date: tomorrow })
    }

    const handleCompleteTask = async () => {
        if (!user || !task?.id) return
        await completeTask({ taskId: task.id, recurring: task.recurring, dueDate: task.due_date })
    }

    const handleUncompleteTask = async () => {
        if (!user || !task?.id) return
        await uncompleteTask({ taskId: task.id })
    }

    return (
        <>
            <div className="flex flex-row rounded-md bg-white p-2 drop-shadow-md">
                <div className="relative mr-2 inline-flex items-center">
                    <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-400 checked:border-green-500 checked:bg-green-500 checked:before:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        onChange={(e) => toggle()}
                        checked={task.is_complete}
                        disabled={disableCheckbox}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                </div>

                <button className="mr-2 flex w-full flex-col justify-evenly"
                    onClick={() => setEditTaskId(task.id)}>
                    <div className='flex justify-between items-start w-full'>
                        <p className={"text-left " + (task.is_complete ? "line-through" : "")}>{task.title}</p>
                        <RecurringIcon recurring={task.recurring || "once"} />
                    </div>
                    <div className="flex w-full justify-start items-center text-gray-400 gap-x-2">
                        <p>{listName}</p>
                        {taskDateStr && <p className='ml-auto'>{taskDateStr}</p>}
                    </div>
                </button >
                <div className="flex flex-col justify-evenly gap-y-1 border-l border-gray-500 pl-2 pr-1">

                    <button
                        className={task.scheduled_today ? "text-green-500 hover:text-green-300" : "text-gray-500 disabled:text-gray-300 enabled:hover:text-gray-300"}
                        onClick={() => task.scheduled_today ? handleRemoveFromToday() : handleAddToToday()}
                        disabled={disbleScheduleToday}>
                        <svg className="h-6 w-6" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="3" width="22" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
                            <rect x="4.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <rect x="18.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <line y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 9.5V10.0556M12 18.9444V19.5M17 14.5H16.4444M7.55556 14.5H7M15.5356 18.0356L15.1427 17.6427M8.85731 11.3573L8.46447 10.9645M15.5356 10.9645L15.1427 11.3573M8.85733 17.6427L8.46449 18.0356M14.2222 14.5C14.2222 15.7273 13.2273 16.7222 12 16.7222C10.7727 16.7222 9.77778 15.7273 9.77778 14.5C9.77778 13.2727 10.7727 12.2778 12 12.2778C13.2273 12.2778 14.2222 13.2727 14.2222 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <button
                        className={task.scheduled_tomorrow ? "text-green-500 hover:text-green-300" : "text-gray-500 disabled:text-gray-300 enabled:hover:text-gray-300"}
                        onClick={() => task.scheduled_tomorrow ? handleRemoveFromTomorrow() : handleAddToTomorrow()}
                        disabled={disbleScheduleTomorrow}>
                        <svg className="h-6 w-6" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="3" width="22" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
                            <rect x="4.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <rect x="18.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <line y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M12.3333 10L17 14.6667L12.3333 19.3333M7 10L11.6667 14.6667L7 19.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div >
            {editTaskId && <TaskModal taskId={editTaskId} onClose={() => setEditTaskId(null)} />
            }
        </>
    )
}