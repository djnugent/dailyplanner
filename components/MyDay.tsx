import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { ErrorModal } from './ErrorModal'
import { useEffect, useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import ListSection from '@/components/ListSection'
import { ChevronDownIcon, ChevronRightIcon, QueueListIcon } from '@heroicons/react/24/outline'
import { TaskDV, List, Day, ListView } from '@/lib/types';
import { useGetSchedule, useCreateAndScheduleTask, useGetList, useGetLists, } from '@/lib/query';
import { date2SqlDateStr } from '@/lib/utils';

function Loading() {
    return (
        <div className="mx-4 py-4 w-full h-[100svh] flex flex-col gap-y-3">
            <div className="h-8 w-[30%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
            <div className="h-14 w-full animate-pulse rounded-md bg-gray-300"></div>
        </div>
    )
}

export default function MyDay({ day, currentListId, setCurrentListId, listView, setListView, listsOverlay, setListsOverlay }: { day: Day, currentListId: number | null, setCurrentListId: (listId: number | null) => void, listView: ListView | null, setListView: (listView: ListView | null) => void, listsOverlay: boolean, setListsOverlay: (listsOverlay: boolean) => void }) {


    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')
    const [newTaskListId, setNewTaskListId] = useState<number | null>(null)
    const [inCompletedTasks, setInCompletedTasks] = useState<TaskDV[]>([])
    const [completedTasks, setCompletedTasks] = useState<TaskDV[]>([])
    const [dueTasks, setDueTasks] = useState<TaskDV[]>([])
    const [showCompleted, setShowCompleted] = useState(false)
    const [newTaskText, setNewTaskText] = useState('')
    const [currentDate, setCurrentDate] = useState(new Date())

    const { status: listsStatus, data: lists, error: listsError } = useGetLists({ supabase });
    const { status: tasksStatus, data: tasks, error: taskError } = useGetSchedule({ supabase, date: currentDate });
    const { mutate: createAndScheduleTask } = useCreateAndScheduleTask({ supabase, queryClient, userId: session?.user?.id });

    const user = session?.user


    useEffect(() => {
        // Set new task list to the first list
        if (lists && lists.length > 0) {
            setNewTaskListId(lists[0].id)
        }

    }, [lists])

    useEffect(() => {
        if (day) {
            const d = new Date()
            d.setHours(0, 0, 0, 0);
            if (day === 'Tomorrow') {
                d.setDate(d.getDate() + 1)
            }
            setCurrentDate(d)
        }
    }, [day])

    const handleAddTask = async () => {
        if (!user || !newTaskListId) return

        const text = newTaskText.trim()
        setNewTaskText('')
        if (!text) return

        const list = lists?.find((list) => list.id === newTaskListId)

        await createAndScheduleTask({ listId: newTaskListId, title: newTaskText, date: currentDate, recurring: list?.recurring_default })
    }

    useEffect(() => {
        if (listsError) setErrorText(listsError.toString())
        if (taskError) setErrorText(taskError.toString())
    }, [listsError, taskError])

    useEffect(() => {
        if (!tasks) return
        const currentDateStr = date2SqlDateStr(currentDate)
        const dueTasks = tasks.filter((task: TaskDV) => (!task.is_complete && task.due_date && task.due_date <= currentDateStr))
        const inCompletedTasks = tasks.filter((task: TaskDV) => (!task.is_complete && !(task.due_date && task.due_date <= currentDateStr)))
        const completedTasks = tasks.filter((task: TaskDV) => task.is_complete)

        setDueTasks(dueTasks)
        setInCompletedTasks(inCompletedTasks)
        setCompletedTasks(completedTasks)

    }, [tasks])

    if (listsStatus === "loading" || tasksStatus === "loading") return <Loading />;

    return (
        <>
            <div className="mx-4 py-4 w-full h-[100svh] flex flex-col">
                <div className="flex flex-row justify-between items-center">
                    <h1 className="text-5xl font-bold">{day}</h1>
                    <button onClick={() => setListsOverlay(true)}>
                        <QueueListIcon className="sm:hidden w-8 h-8" />
                    </button>
                </div>
                <div className="grow overflow-y-scroll">
                    <div className="mt-3 flex flex-col gap-y-2">
                        {(inCompletedTasks && inCompletedTasks.length > 0) ? (
                            inCompletedTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    disableCheckbox={day == Day.Tomorrow}
                                />
                            ))) : <p className='text-gray-500'>Its looking pretty empty here 🦗</p>
                        }
                    </div>
                    {dueTasks && dueTasks.length > 0 && (
                        <div className="mt-3 flex flex-col gap-y-2">
                            <h2 className="text-xl font-bold">On This Day</h2>
                            {dueTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                />
                            ))}
                        </div>
                    )}
                    {completedTasks && completedTasks.length > 0 && (
                        <div className="mt-3 flex flex-col gap-y-2">
                            <div className="flex flex-row items-center gap-x-2">
                                <h2 className="text-xl font-bold">Completed</h2>
                                <button onClick={() => setShowCompleted(!showCompleted)}>
                                    {showCompleted ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
                                </button>
                            </div>
                            {showCompleted && completedTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-full rounded-md bg-white p-2 my-4 drop-shadow-md flex items-center">
                    <select
                        className="outline-none"
                        onChange={(e) => setNewTaskListId(parseInt(e.target.value))}
                        value={newTaskListId || "disabled"} >
                        <option value="disabled" disabled></option>
                        {lists && lists.map((list) => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="New task..."
                        className="w-full outline-none ml-1"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTask();
                            }
                        }}
                    />
                </div>
            </div >
            {listsOverlay &&
                <div className='fixed w-screen h-[100svh] z-30 bg-gray-200 p-10'>
                    <ListSection
                        currentListId={currentListId}
                        setCurrentListId={setCurrentListId}
                        listView={listView}
                        setListView={setListView}
                        setListsOverlay={setListsOverlay}
                    />
                </div>
            }
            <ErrorModal errorText={errorText} onClose={() => setErrorText('')} />
        </>
    )
}
