import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchList, fetchTasks, createTask } from '@/lib/db'
import { ErrorModal } from './ErrorModal'
import { useEffect, useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import { ChevronDownIcon, ChevronRightIcon, QueueListIcon } from '@heroicons/react/24/outline'
import { ListView, TaskDV } from '@/lib/types';
import { isTaskCompleted } from '@/lib/utils';
import ListSection from './ListSection';

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

export default function TaskSection({ currentListID, setCurrentListID, listView, setListView, listsOverlay, setListsOverlay }: { currentListID: number | null, setCurrentListID: (listID: number | null) => void, listView: ListView | null, setListView: (listView: ListView | null) => void, listsOverlay: boolean, setListsOverlay: (listsOverlay: boolean) => void }) {
    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')
    const [listName, setListName] = useState<string | null>(null)
    const [inCompletedTasks, setInCompletedTasks] = useState<TaskDV[]>([])
    const [completedTasks, setCompletedTasks] = useState<TaskDV[]>([])
    const [showCompleted, setShowCompleted] = useState(false)
    const [newTaskText, setNewTaskText] = useState('')

    // @ts-ignore
    const { status: listStatus, data: list, error: listError } = useQuery(["list", currentListID], () => fetchList({ supabase, listID: currentListID }));
    // @ts-ignore
    const { status: tasksStatus, data: tasks, error: taskError } = useQuery(["tasks", currentListID], () => fetchTasks({ supabase, listID: currentListID }));

    const user = session?.user

    const { mutate: mutateCreateTask } = useMutation(createTask, {
        onSuccess: () => {
            queryClient.invalidateQueries(["tasks", currentListID]);
        },
    });

    const handleAddTask = async () => {
        if (!user || !currentListID || !list) return

        const text = newTaskText.trim()
        setNewTaskText('')
        if (!text) return

        await mutateCreateTask({ supabase, userID: user.id, listID: currentListID, text: newTaskText, recurring: list.recurring_default })
    }

    useEffect(() => {
        if (list) setListName(list.name)
    }, [list])

    useEffect(() => {
        if (listError) setErrorText(listError.toString())
        if (taskError) setErrorText(taskError.toString())
    }, [listError, taskError])

    useEffect(() => {
        if (!tasks) return
        const inCompletedTasks = tasks.filter((task) => !isTaskCompleted(task))
        const completedTasks = tasks.filter((task) => isTaskCompleted(task))

        setInCompletedTasks(inCompletedTasks)
        setCompletedTasks(completedTasks)

    }, [tasks])

    if (listStatus === "loading" || tasksStatus === "loading") return <Loading />;

    return (
        <>
            <div className="mx-4 py-4 w-full h-[100svh] flex flex-col">
                <div className="flex flex-row justify-between items-center">
                    <h1 className="text-5xl font-bold">{listName}</h1>
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
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-full rounded-md bg-white p-2 my-4 drop-shadow-md mb-4">
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
                </div>
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
