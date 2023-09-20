import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchArchivedTasks } from '@/lib/db'
import { ErrorModal } from './ErrorModal'
import { useEffect, useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import ListSection from '@/components/ListSection'
import { QueueListIcon } from '@heroicons/react/24/outline';
import { ListView } from '@/lib/types';

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

export default function Archive({ currentListID, setCurrentListID, listView, setListView, listsOverlay, setListsOverlay }: { currentListID: number | null, setCurrentListID: (listID: number | null) => void, listView: ListView | null, setListView: (listView: ListView | null) => void, listsOverlay: boolean, setListsOverlay: (listsOverlay: boolean) => void }) {
    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')

    const { status: tasksStatus, data: tasks, error: taskError } = useQuery(["tasks", "archive"], () => fetchArchivedTasks({ supabase }));

    const user = session?.user

    useEffect(() => {
        if (taskError) setErrorText(taskError.toString())
    }, [taskError])

    if (tasksStatus === "loading") return <Loading />;

    return (
        <>
            <div className="mx-4 py-4 w-full h-[100svh] flex flex-col">
                <div className="flex flex-row justify-between items-center">
                    <h1 className="text-5xl font-bold">🗄️ Archive</h1>
                    <button onClick={() => setListsOverlay(true)}>
                        <QueueListIcon className="sm:hidden w-8 h-8" />
                    </button>
                </div>
                <div className="grow overflow-y-scroll">
                    <div className="mt-3 flex flex-col gap-y-2">
                        {(tasks && tasks.length > 0) ? (
                            tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                />
                            ))) : <p className='text-gray-500'>Its looking pretty empty here 🦗</p>
                        }
                    </div>
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
