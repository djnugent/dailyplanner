import { Database } from '@/lib/schema'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { TaskModal } from '@/components/TaskModal'
import cx from 'classnames/bind'
import { useMutation, useQueryClient, useQuery } from "react-query";
import { RecurringIcon } from './RecurringIcon'
import { createPlannedTask, updatePlannedTask, deletePlannedTask, fetchTask, fetchList } from '@/lib/db'
import { TaskDV, PlannedTask, Day } from '@/lib/types'
import { dateToSQLDateStr_CST, isTaskCompleted } from '@/lib/utils'

export function TaskCard({ task }: { task: TaskDV }) {
    const session = useSession()
    const queryClient = useQueryClient();
    const supabase = useSupabaseClient<Database>()
    const [errorText, setErrorText] = useState('')
    const [isCompleted, setIsCompleted] = useState(false)
    const [editTaskID, setEditTaskID] = useState<number | null>(null)
    const [taskDateStr, setTaskDateStr] = useState<string | null>(null)
    const [listName, setListName] = useState<string | null>(null)
    const { status, data: list, error } = useQuery(["list", task.list_id], () => fetchList({ supabase, listID: task.list_id }));


    const user = session?.user

    useEffect(() => {
        const populateTaskDateStr = async () => {
            if (task.date) {
                const d = new Date(task.date)
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
                    setTaskDateStr(d.toLocaleDateString())
                }
            }
            else {
                setTaskDateStr(null)
            }
        }
        populateTaskDateStr();
    }, [task.date])

    useEffect(() => {
        if (list) setListName(list.name)
    }, [list])


    const mutatedTaskCacheUpdate = {
        onSuccess: async () => {
            const updatedTaskDV = await fetchTask({ supabase, taskID: task.id });

            const updateDataForKey = (key: any[]) => {
                queryClient.setQueryData(key, (oldData: any) => {
                    if (!oldData) return oldData;
                    const oData = oldData as TaskDV[];
                    return oData?.map(task => task.id === updatedTaskDV.id ? updatedTaskDV : task);
                });
            };

            // Update individual task cache
            queryClient.setQueryData(["task", updatedTaskDV.id], updatedTaskDV);

            // Update lists of tasks caches
            updateDataForKey(["tasks", updatedTaskDV.list_id]);
            updateDataForKey(["tasks", "archive"]);
            queryClient.invalidateQueries(["tasks", Day.Today]);
            queryClient.invalidateQueries(["tasks", Day.Tomorrow]);
        },
    };

    const { mutate: mutateCreatePlannedTask } = useMutation(createPlannedTask, mutatedTaskCacheUpdate);
    const { mutate: mutateUpdatePlannedTask } = useMutation(updatePlannedTask, mutatedTaskCacheUpdate);
    const { mutate: mutateDeletePlannedTask } = useMutation(deletePlannedTask, mutatedTaskCacheUpdate);


    useEffect(() => {
        setIsCompleted(isTaskCompleted(task))
    }, [task])

    const toggle = async () => {
        if (isCompleted) {
            console.log('handleUncompleteTask')
            await handleUncompleteTask()
        }
        else {
            console.log('handleCompleteTask')
            await handleCompleteTask()
        }
    }

    const handleAddToToday = async () => {
        if (!user || !task || !task.id) return
        const today = new Date()
        const dateStr = dateToSQLDateStr_CST(today);
        await mutateCreatePlannedTask({ supabase, userID: user?.id, taskID: task.id, date: dateStr, completeUpTo: null })
    }

    const handleAddToTomorrow = async () => {
        if (!user || !task || !task.id) return
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = dateToSQLDateStr_CST(tomorrow);
        await mutateCreatePlannedTask({ supabase, userID: user?.id, taskID: task.id, date: dateStr, completeUpTo: null })
    }

    const handleRemoveFromToday = async () => {
        if (!user || !task?.today) return
        const pt = task.today as PlannedTask
        await mutateDeletePlannedTask({ supabase, plannedTaskID: pt.id })
    }

    const handleRemoveFromTomorrow = async () => {
        if (!user || !task?.tomorrow) return
        const pt = task.tomorrow as PlannedTask
        await mutateDeletePlannedTask({ supabase, plannedTaskID: pt.id })
    }

    const handleCompleteTask = async () => {
        if (!user || !task?.id) return

        // Calculated completed_up_to date
        let d = new Date()
        if (task.recurring === 'once') {
            d.setFullYear(4000) // far in the future
        }
        else if (task.recurring === 'perpetual') {
            d = new Date(d.getTime() + (24 * 60 * 60 * 1000)); // tomorrow
        }
        else {
            if (!task.date) {
                setErrorText('Task has no date but is recurring. Cant calculate completed_up_to date')
            }
            d = new Date(task.date as string) // sql string to date
        }
        const completeUpToDateStr = dateToSQLDateStr_CST(d);

        if (!task.today) {
            // if not, create plannedtask for today
            const today = new Date()
            const dateStr = dateToSQLDateStr_CST(today);
            await mutateCreatePlannedTask({ supabase, userID: user?.id, taskID: task.id, date: dateStr, completeUpTo: completeUpToDateStr })
        }
        else {
            const pt = task.today as PlannedTask
            await mutateUpdatePlannedTask({ supabase, plannedTaskID: pt.id, updates: { complete_up_to: completeUpToDateStr } })
        }

    }

    const handleUncompleteTask = async () => {
        if (!user || !task?.id || !task?.most_recent) return

        // Update task to be uncompleted
        const pt = task.most_recent as PlannedTask
        await mutateUpdatePlannedTask({ supabase, plannedTaskID: pt.id, updates: { complete_up_to: null } })
    }

    return (
        <>
            <div className="flex flex-row rounded-md bg-white p-2 drop-shadow-md">
                <div className="relative mr-2 inline-flex items-center">
                    <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-400 checked:border-green-500 checked:bg-green-500 checked:before:bg-green-500 disabled:opacity-50"
                        onChange={(e) => toggle()}
                        checked={isCompleted}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                </div>

                <button className="mr-2 flex w-full flex-col justify-evenly"
                    onClick={() => setEditTaskID(task.id)}>
                    <div className='flex justify-between items-start w-full'>
                        <p className={"text-left " + (isCompleted ? "line-through" : "")}>{task.text}</p>
                        <RecurringIcon recurring={task.recurring || "once"} />
                    </div>
                    <div className="flex w-full justify-start items-center text-gray-400 gap-x-2">
                        <p>{listName}</p>
                        {taskDateStr && <p className='ml-auto'>{taskDateStr}</p>}
                    </div>
                </button >
                <div className="flex flex-col justify-evenly gap-y-1 border-l border-gray-500 pl-2 pr-1">
                    <button
                        className={task.today ? "text-green-500 hover:text-green-300" : "text-gray-500 hover:text-gray-300"}
                        onClick={() => task.today ? handleRemoveFromToday() : handleAddToToday()}>
                        <svg className="h-6 w-6" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="3" width="22" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
                            <rect x="4.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <rect x="18.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                            <line y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 9.5V10.0556M12 18.9444V19.5M17 14.5H16.4444M7.55556 14.5H7M15.5356 18.0356L15.1427 17.6427M8.85731 11.3573L8.46447 10.9645M15.5356 10.9645L15.1427 11.3573M8.85733 17.6427L8.46449 18.0356M14.2222 14.5C14.2222 15.7273 13.2273 16.7222 12 16.7222C10.7727 16.7222 9.77778 15.7273 9.77778 14.5C9.77778 13.2727 10.7727 12.2778 12 12.2778C13.2273 12.2778 14.2222 13.2727 14.2222 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className={task.tomorrow ? "text-green-500 hover:text-green-300" : "text-gray-500 hover:text-gray-300"}
                        onClick={() => task.tomorrow ? handleRemoveFromTomorrow() : handleAddToTomorrow()}>
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
            {editTaskID && <TaskModal taskID={editTaskID} onClose={() => setEditTaskID(null)} />
            }
        </>
    )
}