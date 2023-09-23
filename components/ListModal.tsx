import { useEffect, useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { ErrorModal } from '@/components/ErrorModal'
import { DeleteModal } from '@/components/DeleteModal'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchList, updateList, deleteList } from '@/lib/db'
import { ListType, Recurring } from '@/lib/types'
import { useDeleteList, useGetList, useUpdateList } from '@/lib/query';

function Loading() {
    return (
        <div className="fixed z-10 inset-0 flex h-[100svh] w-screen items-center justify-center bg-gray-200 bg-opacity-75">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    )
}


export function ListModal({ listId, currentListId, setCurrentListId, onClose }: { listId: number, currentListId: number | null, setCurrentListId: (listId: number | null) => void, onClose: () => void }) {
    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')
    const { status, data: list, error } = useGetList({ supabase, listId });
    const { mutate: updateList } = useUpdateList({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: deleteList } = useDeleteList({ supabase, queryClient, userId: session?.user?.id });
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [listName, setListName] = useState("");

    const user = session?.user



    const handleUpdateListName = async () => {
        if (!user) return

        const name = listName.trim()
        setListName(name)
        if (!name) {
            setErrorText('List name cannot be empty')
            return
        }

        await updateList({ supabase, listId, updates: { name: name } })
    }

    const handleUpdateListType = async (type: ListType) => {
        if (!user) return
        await updateList({ supabase, listId, updates: { type: type } })
    }

    const handleUpdateListRecurring = async (recurring: Recurring) => {
        if (!user) return
        await updateList({ supabase, listId, updates: { recurring_default: recurring } })
    }

    const handleDeleteList = async () => {
        if (!user) return
        await deleteList({ supabase, listId })
        if (listId === currentListId) setCurrentListId(null);
        onClose()
    }

    useEffect(() => {
        if (list) setListName(list.name)
    }, [list])

    useEffect(() => {
        if (error) setErrorText(error.toString())
    }, [error])

    if (status === "loading") return <Loading />;

    return (
        <>
            <div className="fixed z-10 inset-0 flex h-[100svh] w-screen items-center justify-center bg-gray-200 bg-opacity-75">
                <div className="z-20 flex w-80 flex-col gap-y-3 rounded-md bg-white p-3 sm:w-full sm:max-w-lg">
                    <input type="text"
                        className="overflow-scroll truncate bg-transparent text-3xl font-bold outline-none"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                            }
                        }}
                        onBlur={() => handleUpdateListName()}
                    />

                    {/* <div className="flex items-center">
                        <div className="flex justify-between">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <p className="ml-3">Type:</p>
                        </div>

                        <select name="type" className="ml-2 w-fit outline-none"
                            value={list?.type || "disabled"}
                            onChange={(e) => handleUpdateListType(e.target.value as ListType)}>
                            <option disabled value={"disabled"} className='hidden'></option>
                            <option value="todo">Todo List</option>
                            <option value="toget">To Get List</option>
                        </select>
                    </div> */}

                    <div className="flex justify-start">
                        <div className="flex justify-between">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                            </svg>
                            <p className="ml-3">Default:</p>
                        </div>
                        <select name="recurring" className="ml-2 w-fit outline-none"
                            value={list?.recurring_default as string || "disabled"}
                            onChange={(e) => handleUpdateListRecurring(e.target.value as Recurring)}>
                            <option disabled value={"disabled"} className='hidden'></option>
                            <option value="once">Once</option>
                            <option value="perpetual">Perpetual</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <hr />
                    <div className="flex justify-between gap-x-4 px-2">
                        <button className="w-fit text-red-500 hover:text-red-400"
                            onClick={() => setConfirmDelete(true)}>Delete</button>
                        <button className="w-fit text-blue-500 hover:text-blue-400"
                            onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
            {confirmDelete && <DeleteModal onDelete={() => handleDeleteList()} onClose={() => setConfirmDelete(false)} />}
            {errorText && <ErrorModal onClose={() => setErrorText('')} errorText={errorText} />}
        </>
    )
}