import { useEffect, useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { ErrorModal } from './ErrorModal'
import { ListModal } from '@/components/ListModal'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchLists, createList } from '@/lib/db'
import { ListView } from '@/lib/types';

function Loading() {
    return (
        <div className="sm:flex h-full basis-1/3 flex-col gap-y-3 justify-start border-r p-4 hidden" >
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[80%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[90%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
            <div className="w-full animate-pulse border-b-2 border-gray-300 bg-gray-300"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[80%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[90%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[80%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-[90%] animate-pulse rounded-full bg-gray-300"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-gray-300"></div>
        </div >
    )
}


export default function ListSection({ currentListID, setCurrentListID, listView, setListView, setListsOverlay }: { currentListID: number | null, setCurrentListID: (listID: number | null) => void, listView: ListView | null, setListView: (listView: ListView | null) => void, setListsOverlay: (listsOverlay: boolean) => void }) {
    const session = useSession()
    const supabase = useSupabaseClient()
    const queryClient = useQueryClient();

    const [newListText, setNewListText] = useState('')
    const [errorText, setErrorText] = useState('')
    const [editListID, setEditListID] = useState<number | null>(null)
    const { status, data: lists, error } = useQuery("lists", () => fetchLists({ supabase }));

    const user = session?.user

    const { mutate: mutateCreateList } = useMutation(createList, {
        onSuccess: () => {
            queryClient.invalidateQueries("lists");
        },
    });

    const handleAddList = async () => {
        if (!user) return

        const text = newListText.trim()
        setNewListText('')
        if (!text) return

        await mutateCreateList({ supabase, userID: user.id, name: newListText, })
    }

    useEffect(() => {
        if (error) setErrorText(error.toString())
    }, [error])

    if (status === "loading") return <Loading />;
    return (
        <>

            <div className='flex justify-between px-1 py-1.5'>
                <p className='text-gray-500 text-sm'>{"👨🏽‍⚕️ " + user?.email?.split("@")[0]}</p>
                <button className="text-blue-500 hover:underline text-sm"
                    onClick={async () => {
                        const { error } = await supabase.auth.signOut()
                        if (error) console.log('Error logging out:', error.message)
                    }}>Logout</button>
            </div>

            <hr className="border-black" />

            <div className="flex flex-col gap-y-1.5 py-1.5">
                <button className={"rounded px-1 text-left hover:text-gray-500 underline-offset-4 " + (listView === ListView.Today) ? "underline" : ""}
                    onClick={() => { setListView(ListView.Today); setCurrentListID(null); setListsOverlay(false); }}>☀️ Today</button>
                <button className={"rounded px-1 text-left hover:text-gray-500 underline-offset-4 " + (listView === ListView.Tomorrow) ? "underline" : ""}
                    onClick={() => { setListView(ListView.Tomorrow); setCurrentListID(null); setListsOverlay(false); }}>🌓 Tomorrow</button>
                <button className={"rounded px-1 text-left hover:text-gray-500 underline-offset-4 " + (listView === ListView.Archive) ? "underline" : ""}
                    onClick={() => { setListView(ListView.Archive); setCurrentListID(null); setListsOverlay(false); }}>🗄️ Archive</button>
                {/* <button className={cx("rounded px-1 text-left hover:text-gray-500 underline-offset-4", listView === ListView.History ? "underline" : "")}
                    onClick={() => { setListView(ListView.History); setCurrentListID(null); setListsOverlay(false); }}>🦕 History</button> */}
            </div >


            <hr className="border-black" />

            <div className="flex flex-col gap-y-1.5 py-1.5">
                {lists && lists.map((list) => (
                    <div key={list.id} className={"flex group gap-x-2 underline-offset-4 text-md sm:text-normal " + (list.id == currentListID) ? "underline" : ""}>
                        <button className="rounded px-1 text-left w-full hover:text-gray-500 truncate"
                            onClick={() => { setListView(null); setCurrentListID(list.id); setListsOverlay(false); }}>
                            {list.name}
                        </button>
                        <button onClick={() => setEditListID(list.id)}>
                            <EllipsisVerticalIcon className="h-6 w-6 text-gray-600 hidden group-hover:block" />
                        </button>
                    </div>
                ))}
                <input type="text"
                    placeholder="New list..."
                    className="bg-transparent px-1 placeholder-slate-500 outline-none"
                    value={newListText}
                    onChange={(e) => setNewListText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddList();
                        }
                    }} />
            </div>
            <ErrorModal errorText={errorText} onClose={() => setErrorText('')} />
            {
                editListID && (
                    <ListModal
                        listID={editListID}
                        currentListID={currentListID}
                        setCurrentListID={setCurrentListID}
                        onClose={() => setEditListID(null)} />
                )
            }
        </>
    )
}