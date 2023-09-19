export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      lists: {
        Row: {
          id: number
          inserted_at: string
          name: string
          order: number | null
          recurring_default: Database["public"]["Enums"]["recurring_t"]
          type: Database["public"]["Enums"]["list_type_t"]
          user_id: string
        }
        Insert: {
          id?: number
          inserted_at?: string
          name: string
          order?: number | null
          recurring_default?: Database["public"]["Enums"]["recurring_t"]
          type: Database["public"]["Enums"]["list_type_t"]
          user_id: string
        }
        Update: {
          id?: number
          inserted_at?: string
          name?: string
          order?: number | null
          recurring_default?: Database["public"]["Enums"]["recurring_t"]
          type?: Database["public"]["Enums"]["list_type_t"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      plannedtask: {
        Row: {
          complete_up_to: string | null
          created_at: string
          date: string | null
          id: number
          is_complete: boolean | null
          task_id: number | null
        }
        Insert: {
          complete_up_to?: string | null
          created_at?: string
          date?: string | null
          id?: number
          is_complete?: boolean | null
          task_id?: number | null
        }
        Update: {
          complete_up_to?: string | null
          created_at?: string
          date?: string | null
          id?: number
          is_complete?: boolean | null
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plannedtask_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plannedtask_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks_detail_view"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          archived: boolean | null
          complete_count: number | null
          date: string | null
          id: number
          inserted_at: string
          list_id: number
          notes: string | null
          order: number | null
          recurring: Database["public"]["Enums"]["recurring_t"] | null
          text: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          complete_count?: number | null
          date?: string | null
          id?: number
          inserted_at?: string
          list_id: number
          notes?: string | null
          order?: number | null
          recurring?: Database["public"]["Enums"]["recurring_t"] | null
          text: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          complete_count?: number | null
          date?: string | null
          id?: number
          inserted_at?: string
          list_id?: number
          notes?: string | null
          order?: number | null
          recurring?: Database["public"]["Enums"]["recurring_t"] | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      tasks_detail_view: {
        Row: {
          archived: boolean | null
          complete_count: number | null
          date: string | null
          id: number
          inserted_at: string
          list_id: number
          most_recent: Json | null
          notes: string | null
          order: number | null
          recurring: Database["public"]["Enums"]["recurring_t"] | null
          text: string
          today: Json | null
          tomorrow: Json | null
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      list_type_t: "todo" | "toget"
      recurring_t:
      | "perpetual"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "once"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
