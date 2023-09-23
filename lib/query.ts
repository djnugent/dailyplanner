

import { SupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery, QueryClient, useMutation } from 'react-query';
import { Task, TaskDV, List, PlannedTask, Recurring, Day } from '@/lib/types'
import { getLists, getList, getTasks, getTask, getSchedule, getArchived } from './api';
import { createList, createTask, createAndScheduleTask, updateList, updateTask, deleteList, deleteTask } from './api';
import { completeTask, uncompleteTask, archiveTask, unarchiveTask, scheduleTask, unscheduleTask, rollforwardTask } from './api';
import { en } from '@supabase/auth-ui-react';

// QUERY HOOKS

export function useGetLists({ supabase }: { supabase: SupabaseClient }) {
    const q = useQuery(["lists"], () => getLists({ supabase }));
    return q
}

export function useGetList({ supabase, listId }: { supabase: SupabaseClient, listId: number | null }) {
    const q = useQuery({
        queryKey: ["list", listId],
        // @ts-ignore
        queryFn: () => getList({ supabase, listId }),
        enabled: listId !== null
    });
    return q
}

export function useGetTasks({ supabase, listId }: { supabase: SupabaseClient, listId: number | null }) {
    const q = useQuery({
        queryKey: ["tasks", listId],
        // @ts-ignore
        queryFn: () => getTasks({ supabase, listId }),
        enabled: listId !== null
    });
    return q
}

export function useGetTask({ supabase, taskId }: { supabase: SupabaseClient, taskId: number }) {
    const q = useQuery(["task", taskId], () => getTask({ supabase, taskId }));
    return q
}

export function useGetSchedule({ supabase, date }: { supabase: SupabaseClient, date: Date }) {
    const q = useQuery(["schedule", date], () => getSchedule({ supabase, date }));
    return q
}

export function useGetArchived({ supabase }: { supabase: SupabaseClient }) {
    const q = useQuery(["archived"], () => getArchived({ supabase }));
    return q
}

// MUTATION HOOKS - CRUD

const mutateListSuccess = async ({ supabase, queryClient, data, variables }: { supabase: SupabaseClient, queryClient: QueryClient, data: any, variables: any }) => {
    if (!data) return;
    const listId = data;
    const updatedList = await getList({ supabase, listId });
    queryClient.setQueryData(["list", updatedList.id], updatedList);
    queryClient.invalidateQueries(["lists"]);
}

const mutateTaskSuccess = async ({ supabase, queryClient, data, variables }: { supabase: SupabaseClient, queryClient: QueryClient, data: any, variables: any }) => {
    if (!data) return;
    const taskId = data;
    const updatedTaskDV = await getTask({ supabase, taskId: taskId });

    const updateDataForKey = (key: any[]) => {
        queryClient.setQueryData(key, (oldData: any) => {
            if (!oldData) return oldData;
            const nData = [...oldData] as TaskDV[];

            // Update in place or add if not found
            if (!nData.find(task => task.id === updatedTaskDV.id)) {
                nData.push(updatedTaskDV);
                return nData;
            }
            return nData.map(task => task.id === updatedTaskDV.id ? updatedTaskDV : task);
        });
    };

    // Update individual task cache
    queryClient.setQueryData(["task", updatedTaskDV.id], updatedTaskDV);

    // Update lists of tasks caches
    updateDataForKey(["tasks", updatedTaskDV.list_id]);
    updateDataForKey(["archived"]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    queryClient.invalidateQueries(["schedule", today]);
    queryClient.invalidateQueries(["schedule", tomorrow]);
};




export function useCreateList({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => createList({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateListSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useUpdateList({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => updateList({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateListSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useDeleteList({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => deleteList({ supabase, userId, ...p }), {
        onSuccess: async (data, variables) => {
            if (!data) return;
            const listId = data;

            queryClient.removeQueries(["list", listId], { exact: true });
            queryClient.invalidateQueries(["lists"]);
            queryClient.invalidateQueries(["archived"]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            queryClient.invalidateQueries(["schedule", today]);
            queryClient.invalidateQueries(["schedule", tomorrow]);
        },
    });
}

export function useCreateTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => createTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useCreateAndScheduleTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => createAndScheduleTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useUpdateTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => updateTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useDeleteTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => deleteTask({ supabase, userId, ...p }), {
        onSuccess: async (data, variables) => {
            if (!data) return;

            const taskId = data.id;
            const listId = data.list_id;

            // Function to filter out the deleted task from cached lists
            const filterDeletedTask = (oldData: TaskDV[] | undefined) => {
                return oldData?.filter(task => task.id !== taskId);
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            queryClient.removeQueries(["task", taskId], { exact: true });
            // @ts-ignore
            queryClient.setQueryData(["tasks", listId], filterDeletedTask);
            // @ts-ignore
            queryClient.setQueryData(["archived"], filterDeletedTask);
            // @ts-ignore
            queryClient.setQueryData(["schedule", today], filterDeletedTask);
            // @ts-ignore
            queryClient.setQueryData(["schedule", tomorrow], filterDeletedTask);
        },
    });
}

// MUTATION HOOKS - TASK ACTIONS
export function useCompleteTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => completeTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useUncompleteTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => uncompleteTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useArchiveTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => archiveTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useUnarchiveTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => unarchiveTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useScheduleTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => scheduleTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useUnscheduleTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => unscheduleTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}

export function useRollforwardTask({ supabase, queryClient, userId }: { supabase: SupabaseClient, queryClient: QueryClient, userId: string | undefined }) {
    return useMutation((p: any) => rollforwardTask({ supabase, userId, ...p }), {
        onSuccess: (data, variables) => mutateTaskSuccess({ supabase, queryClient, data, variables }),
    });
}