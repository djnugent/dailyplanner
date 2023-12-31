import { useState, forwardRef, useEffect, use } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, useMutation, useQueryClient } from "react-query";
import { ErrorModal } from '@/components/ErrorModal'
import { DeleteModal } from '@/components/DeleteModal'
import cx from 'classnames/bind'
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'
import { PlannedTask, Recurring, Day, TaskDV } from '@/lib/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { date2SqlDateStr, sqlDateStr2Date } from '@/lib/utils';
import { useGetLists, useGetTask, useUpdateTask, useDeleteTask, useCompleteTask, useUncompleteTask, useScheduleTask, useUnscheduleTask, useArchiveTask, useUnarchiveTask } from '@/lib/query';
import { ResizableTextInput } from '@/components/ResizableTextInput';

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

export function TaskModal({ taskId, onClose }: { taskId: number, onClose: () => void }) {
    const supabase = useSupabaseClient()
    const session = useSession()
    const queryClient = useQueryClient();
    const [errorText, setErrorText] = useState('')
    const [newTaskTitle, setNewTaskText] = useState('')
    const [newTaskNotes, setNewTaskNotes] = useState('')
    const [taskDate, setTaskDate] = useState<Date | null>(null)
    const [completedAtStr, setCompletedAtStr] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const { status: taskStatus, data: task, error: taskError } = useGetTask({ supabase, taskId: taskId });
    const { status: listsStatus, data: lists, error: listsError } = useGetLists({ supabase });
    const { mutate: updateTask } = useUpdateTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: deleteTask } = useDeleteTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: completeTask } = useCompleteTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: uncompleteTask } = useUncompleteTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: scheduleTask } = useScheduleTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: unscheduleTask } = useUnscheduleTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: archiveTask } = useArchiveTask({ supabase, queryClient, userId: session?.user?.id });
    const { mutate: unarchiveTask } = useUnarchiveTask({ supabase, queryClient, userId: session?.user?.id });


    const user = session?.user

    const DateInput = forwardRef(
        ({ value, onClick }: { value: string, onClick: () => void }, ref: any) => (
            <button name="adddate" className={"w-fit ml-2 " + (value ? "text-black" : "text-gray-500")} onClick={onClick} ref={ref}>
                {value || "+ Add date"}
            </button>
        )
    );
    DateInput.displayName = "DateInput";

    useEffect(() => {
        const populateCompleteUpToDateStr = () => {
            if (!task?.completed_at || !task?.completed_until) {
                setCompletedAtStr(null)
                return
            }
            var str = "Completed on "
            const compDate = sqlDateStr2Date(task.completed_at)
            str += compDate.toDateString()
            if (task.recurring !== 'once') {
                const today = new Date();
                const until = sqlDateStr2Date(task.completed_until);

                // set time to midnight for accurate day difference
                today.setHours(0, 0, 0, 0);
                compDate.setHours(0, 0, 0, 0);
                const differenceInMilliseconds = until.getTime() - today.getTime();
                const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
                const daysRemaining = Math.floor(differenceInDays + 1);
                str += ` (resets in ${daysRemaining} days)`
            }
            setCompletedAtStr(str)
        }
        populateCompleteUpToDateStr();
    }, [task])


    const handleUpdateTaskTitle = async () => {
        if (!taskId) return

        const text = newTaskTitle.trim()
        setNewTaskText(text)
        if (!text) {
            setErrorText('Task text cannot be empty')
            return
        }

        await updateTask({ taskId, updates: { title: text } })
    }

    const handleUpdateTaskList = async (listId: number) => {
        if (!taskId) return
        await updateTask({ taskId, updates: { list_id: listId } })
    }

    const handleUpdateTaskDate = async (date: Date | null) => {
        if (!taskId) return
        await updateTask({ taskId, updates: { due_date: date } })
    }

    const handleRemoveTaskDate = async () => {
        if (!taskId) return
        setTaskDate(null)
        const recurring = (task?.recurring == 'once' || task?.recurring == 'perpetual') ? task?.recurring : 'once'
        await updateTask({ taskId, updates: { due_date: null, recurring } })
    }

    const handleUpdateTaskRecurring = async (recurring: Recurring) => {
        if (!taskId) return
        await updateTask({ taskId, updates: { recurring: recurring } })
    }

    const handleUpdateTaskArchived = async (archived: boolean) => {
        if (!taskId) return
        if (archived) await archiveTask({ taskId })
        else await unarchiveTask({ taskId })
    }

    const handleUpdateTaskNotes = async (notes: string) => {
        if (!taskId) return
        await updateTask({ taskId, updates: { notes: notes } })
    }

    const handleDeleteTask = async () => {
        if (!taskId) return
        await deleteTask({ taskId: taskId })
        onClose()
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
        if (!user || !task?.scheduled_today) return
        const today = new Date()
        await unscheduleTask({ taskId: task.id, date: today })
    }

    const handleRemoveFromTomorrow = async () => {
        if (!user || !task?.scheduled_tomorrow) return
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await unscheduleTask({ taskId: task.id, date: tomorrow })
    }

    const toggle = async () => {
        if (task?.is_complete) {
            await handleUncompleteTask()
        }
        else {
            await handleCompleteTask()
        }
    }

    const handleCompleteTask = async () => {
        if (!user || !task?.id) return
        await completeTask({ taskId: task.id, recurring: task.recurring, dueDate: task.due_date })
    }

    const handleUncompleteTask = async () => {
        if (!user || !task?.id) return
        await uncompleteTask({ taskId: task.id })
    }


    useEffect(() => {
        if (task?.title) {
            setNewTaskText(task.title)
        }
        if (task?.notes) {
            setNewTaskNotes(task.notes || "")
        }
        if (task?.due_date) {
            setTaskDate(sqlDateStr2Date(task.due_date))
        }
    }, [task])


    if (taskStatus === "loading" || listsStatus === "loading") return <Loading />;

    return (
        <>
            <div className="fixed z-10 inset-0 flex h-[100svh] w-screen items-center justify-center bg-gray-200 bg-opacity-75">
                <div className="flex flex-col rounded-md bg-white p-3 gap-y-3 w-96 sm:w-full sm:max-w-lg">

                    <div className="flex flex-nowrap">
                        <div className="inline-flex items-center relative mr-2">
                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-400 checked:border-green-500 checked:bg-green-500 checked:before:bg-green-500"
                                checked={task?.is_complete}
                                onChange={() => toggle()} />
                            <div className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100 -translate-x-1/2 left-1/2 -translate-y-1/2 top-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <ResizableTextInput
                            placeholder="Eat Lasagna"
                            className={"bg-transparent text-lg md:text-3xl font-bold outline-none grow " + (task?.is_complete ? "line-through" : "")}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onBlur={() => handleUpdateTaskTitle()} />
                    </div>

                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <select name="lists" className="w-fit outline-none ml-2"
                            value={task?.list_id}
                            onChange={(e) => handleUpdateTaskList(parseInt(e.target.value))}>
                            {lists && lists.map((list) => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>

                    </div>

                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                        </svg>
                        <DatePicker
                            selected={taskDate}
                            onChange={(date: Date) => handleUpdateTaskDate(date)}
                            //@ts-ignore
                            customInput={<DateInput />}
                        />
                        {taskDate && <XMarkIcon className="h-5 w-5 ml-2 cursor-pointer" onClick={() => handleRemoveTaskDate()} />}
                    </div>

                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                        </svg>
                        <select name="recurring" className="w-fit outline-none ml-2"
                            value={task?.recurring || "disabled"}
                            onChange={(e) => handleUpdateTaskRecurring(e.target.value as Recurring)}>
                            <option disabled value={"disabled"} className='hidden'></option>
                            <option value="once">Once</option>
                            <option value="perpetual">Perpetual</option>
                            <option value="daily" disabled={!task?.due_date}>Daily</option>
                            <option value="weekly" disabled={!task?.due_date}>Weekly</option>
                            <option value="monthly" disabled={!task?.due_date}>Monthly</option>
                            <option value="yearly" disabled={!task?.due_date}>Yearly</option>
                        </select>
                    </div>


                    <div className="flex justify-start gap-x-6">
                        <div className="flex justify-between">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                            <p className="ml-2">Add to:</p>
                        </div>
                        <button className={"w-fit flex items-center gap-x-1 " +
                            (task?.scheduled_today ? "text-green-500 hover:text-green-300" : "text-gray-500 hover:text-gray-300")}
                            onClick={() => task?.scheduled_today ? handleRemoveFromToday() : handleAddToToday()}>
                            <svg className="h-5 w-5" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="3" width="22" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
                                <rect x="4.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                                <rect x="18.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                                <line y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 9.5V10.0556M12 18.9444V19.5M17 14.5H16.4444M7.55556 14.5H7M15.5356 18.0356L15.1427 17.6427M8.85731 11.3573L8.46447 10.9645M15.5356 10.9645L15.1427 11.3573M8.85733 17.6427L8.46449 18.0356M14.2222 14.5C14.2222 15.7273 13.2273 16.7222 12 16.7222C10.7727 16.7222 9.77778 15.7273 9.77778 14.5C9.77778 13.2727 10.7727 12.2778 12 12.2778C13.2273 12.2778 14.2222 13.2727 14.2222 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>Today</p>
                        </button>
                        <button className={"w-fit flex items-center gap-x-1 " +
                            (task?.scheduled_tomorrow ? " text-green-500 hover:text-green-300" : "text-gray-500 hover:text-gray-300")}
                            onClick={() => task?.scheduled_tomorrow ? handleRemoveFromTomorrow() : handleAddToTomorrow()}>
                            <svg className="h-5 w-5" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="3" width="22" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
                                <rect x="4.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                                <rect x="18.5" y="0.5" width="1" height="4" rx="0.5" stroke="currentColor" />
                                <line y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2" />
                                <path d="M12.3333 10L17 14.6667L12.3333 19.3333M7 10L11.6667 14.6667L7 19.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>Tomorrow</p>
                        </button>
                    </div>

                    <textarea
                        className="bg-transparent outline-none resize-none"
                        placeholder="Notes..."
                        rows={2}
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        onBlur={() => handleUpdateTaskNotes(newTaskNotes)}
                    >
                    </textarea>

                    <div>
                        {/* @ts-ignore */}
                        <p className="text-gray-500 text-sm">{"Created " + new Date(task?.inserted_at).toLocaleString()}</p>
                        <p className="text-gray-500 text-sm">{completedAtStr}</p>
                        {task?.archived && <p className="text-gray-500 text-sm">Archived</p>}
                    </div>

                    <hr />

                    <div className="flex justify-end gap-x-4 px-2">
                        <button className="w-fit text-red-500 hover:text-red-400"
                            onClick={() => setConfirmDelete(true)}>Delete</button>
                        {!task?.archived && <button className="w-fit mr-auto text-gray-500 rounded-md hover:text-gray-400"
                            onClick={() => handleUpdateTaskArchived(true)}>Archive</button>}
                        {task?.archived && <button className="w-fit mr-auto text-gray-500 rounded-md hover:text-gray-400"
                            onClick={() => handleUpdateTaskArchived(false)}>Unarchive</button>}
                        <button className="w-fit text-blue-500 hover:text-blue-400"
                            onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>

            {confirmDelete && <DeleteModal onDelete={() => handleDeleteTask()} onClose={() => setConfirmDelete(false)} />}
            {errorText && <ErrorModal onClose={() => setErrorText('')} errorText={errorText} />}
        </>
    )
}