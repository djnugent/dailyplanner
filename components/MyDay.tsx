import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchLists, fetchMyDayTasks, createTask, createPlannedTask } from '@/lib/db'
import { ErrorModal } from './ErrorModal'
import { useEffect, useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import ListSection from '@/components/ListSection'
import { ChevronDownIcon, ChevronRightIcon, QueueListIcon } from '@heroicons/react/24/outline'
import { TaskDV, List, Day } from '@/lib/types';
import { dateToSQLDateStr_CST } from '@/lib/utils';

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

export default function MyDay({ day, currentListID, setCurrentListID, listView, setListView, listsOverlay, setListsOverlay }: { day: Day, currentListID: number, setCurrentListID: (listID: number) => void, listView: string, setListView: (listView: string) => void, listsOverlay: boolean, setListsOverlay: (listsOverlay: boolean) => void }) {

    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')
    const [newTaskList, setNewTaskList] = useState<List | null>(null)
    const [inCompletedTasks, setInCompletedTasks] = useState<TaskDV[]>([])
    const [completedTasks, setCompletedTasks] = useState<TaskDV[]>([])
    const [showCompleted, setShowCompleted] = useState(false)
    const [newTaskText, setNewTaskText] = useState('')

    const { status: tasksStatus, data: tasks, error: taskError } = useQuery(["tasks", day], () => fetchMyDayTasks({ supabase, day }));
    const { status: listsStatus, data: lists, error: listsError } = useQuery("lists", () => fetchLists({ supabase }));

    const user = session?.user

    const { mutate: mutateCreateTask } = useMutation(createTask, {
        onSuccess: () => {
            queryClient.invalidateQueries(["tasks", newTaskList]);
        },
    });

    const { mutate: mutateCreatePlannedTask, data: newPlannedTask } = useMutation(createPlannedTask, {
        onSuccess: () => {
            queryClient.invalidateQueries(["tasks", newTaskList?.id]);
            queryClient.invalidateQueries(["tasks", Day.Today]);
            queryClient.invalidateQueries(["tasks", Day.Tomorrow]);
        },
    });


    useEffect(() => {
        // Set new task list to the first list
        if (lists && lists.length > 0) {
            setNewTaskList(lists[0])
        }

    }, [lists])

    const handleAddTask = async () => {
        if (!user || !newTaskList) return

        const text = newTaskText.trim()
        setNewTaskText('')
        if (!text) return

        await mutateCreateTask({ supabase, userID: user.id, listID: newTaskList.id, text: newTaskText, recurring: newTaskList.recurring_default })

        const today = new Date()
        if (day === Day.Tomorrow) today.setDate(today.getDate() + 1)
        const dateStr = dateToSQLDateStr_CST(today);
        // TODO need to get task id from newly created task some how
        await mutateCreatePlannedTask({ supabase, userID: user.id, taskID: task.id, date: dateStr })
    }

    useEffect(() => {
        if (listsError) setErrorText(listsError.toString())
        if (taskError) setErrorText(taskError.toString())
    }, [listsError, taskError])

    useEffect(() => {
        if (!tasks) return
        const inCompletedTasks = tasks.filter((task: TaskDV) => !task.archived)
        const completedTasks = tasks.filter((task: TaskDV) => task.archived)

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
                                    listName={lists?.find((list) => list.id === task.list_id)?.name}
                                />
                            ))) : <p className='text-gray-500'>Its looking pretty empty here 🦗</p>
                        }
                    </div>
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
                                    listName={lists?.find((list) => list.id === task.list_id)?.name} />
                            ))}
                        </div>
                    )}
                </div>
                {/* <div className="w-full rounded-md bg-white p-2 my-4 drop-shadow-md flex items-center">
                    <select>
                        {lists && lists.map((list) => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="New task..."
                        className="w-full outline-none"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTask();
                            }
                        }}
                    />
                </div> */}
            </div>
            {listsOverlay &&
                <div className='fixed w-screen h-[100svh] z-30 bg-gray-200 p-10'>
                    <ListSection
                        currentListID={currentListID}
                        setCurrentListID={setCurrentListID}
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
