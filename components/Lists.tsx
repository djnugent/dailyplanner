import { Database } from '@/lib/schema'
import { Session, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { List } from '@/lib/types'

export default function TodoLists({ session }: { session: Session }) {
    const supabase = useSupabaseClient<Database>()
    const [lists, setLists] = useState<List[]>([])
    const [newListName, setNewListName] = useState('')
    const [errorText, setErrorText] = useState('')

    const user = session.user

    useEffect(() => {
        const fetchTodos = async () => {
            const { data: todos, error } = await supabase
                .from('lists')
                .select('*')
                .order('id', { ascending: true })

            if (error) console.log('error', error)
            else setLists(todos)
        }

        fetchTodos()
    }, [supabase])

    const addList = async (listName: string) => {
        let name = listName.trim()
        if (name.length) {
            const { data: list, error } = await supabase
                .from('lists')
                .insert({ name, user_id: user.id, type: "todo" })
                .select()
                .single()

            if (error) {
                setErrorText(error.message)
            } else {
                setLists([...lists, list])
                setNewListName('')
            }
        }
    }

    const deleteTodo = async (id: number) => {
        try {
            await supabase.from('lists').delete().eq('id', id).throwOnError()
            setLists(lists.filter((x) => x.id != id))
        } catch (error) {
            console.log('error', error)
        }
    }

    return (
        <div className="w-full">
            <h1 className="mb-12">Lists</h1>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    addList(newListName)
                }}
                className="flex gap-2 my-2"
            >
                <input
                    className="rounded w-full p-2"
                    type="text"
                    placeholder="make coffee"
                    value={newListName}
                    onChange={(e) => {
                        setErrorText('')
                        setNewListName(e.target.value)
                    }}
                />
                <button className="btn-black" type="submit">
                    Add
                </button>
            </form>
            {!!errorText && <Alert text={errorText} />}
            <div className="bg-white shadow overflow-hidden rounded-md">
                <ul>
                    {lists.map((list) => (
                        <List key={list.id} list={list} onDelete={() => deleteTodo(list.id)} />
                    ))}
                </ul>
            </div>
        </div>
    )
}

const List = ({ list, onDelete }: { list: List; onDelete: () => void }) => {
    const supabase = useSupabaseClient<Database>()

    return (
        <li className="w-full block cursor-pointer hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition duration-150 ease-in-out">
            <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="min-w-0 flex-1 flex items-center">
                    <div className="text-sm leading-5 font-medium truncate">{list.name}</div>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="w-4 h-4 ml-2 border-2 hover:border-black rounded"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="gray">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </li>
    )
}

const Alert = ({ text }: { text: string }) => (
    <div className="rounded-md bg-red-100 p-4 my-3">
        <div className="text-sm leading-5 text-red-700">{text}</div>
    </div>
)
