import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchLists, fetchArchivedTasks, createTask } from '@/lib/db'
import { ErrorModal } from './ErrorModal'
import { useEffect, useState } from 'react'
import { TaskCard } from '@/components/TaskCard'

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

export default function History() {
    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')

    const { status: tasksStatus, data: tasks, error: taskError } = useQuery(["archive"], () => fetchArchivedTasks({ supabase }));


    const user = session?.user

    useEffect(() => {
        if (taskError) setErrorText(taskError.toString())
    }, [taskError])

    if (tasksStatus === "loading") return <Loading />;

    return (
        <>
            <div className="mx-4 py-4 w-full h-[100svh] flex flex-col">
                <h1 className="text-5xl font-bold">🦕 History</h1>
                <div className="grow overflow-y-scroll">
                    <div className="mt-3 flex flex-col gap-y-2">
                        <p className='text-xl'>🚧 👷🏿‍♀️ 🔧 Under Construction...maybe forever</p>
                        {/* {(tasks && tasks.length > 0) ? (
                            tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    listName="NEED TO FIX"
                                />
                            ))) : <p className='text-gray-500'>Its looking pretty empty here 🦗</p>
                        } */}
                    </div>
                </div>
            </div>
            <ErrorModal errorText={errorText} onClose={() => setErrorText('')} />
        </>
    )
}
