import { useEffect, useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Login from '@/components/Login'
import TaskSection from '@/components/TaskSection'
import ListSection from '@/components/ListSection'
import Archive from '@/components/Archive'
import History from '@/components/History'
import { ListView, Day } from '@/lib/types'
import MyDay from '@/components/MyDay'

export default function Home() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [currentListId, setCurrentListId] = useState<number | null>(null)
  const [listView, setListView] = useState<ListView | null>(null)
  const [listsOverlay, setListsOverlay] = useState<boolean>(false)

  useEffect(() => {
    if (!listView && !currentListId) setListView(ListView.Today)
  }, [listView, currentListId])

  return (
    <>
      {!session ? (
        <div className="w-full h-full bg-gray-200">
          <Login supabase={supabase} />
        </div>
      ) : (
        <div className="bg-gray-200 flex h-[100svh] justify-center w-screen">
          <div className="h-full w-full max-w-2xl">
            <div className="flex h-full w-full">
              <div className="sm:flex h-full basis-1/3 flex-col justify-start border-r p-4 hidden">
                <ListSection
                  currentListId={currentListId}
                  setCurrentListId={setCurrentListId}
                  listView={listView}
                  setListView={setListView}
                  setListsOverlay={setListsOverlay}
                />
              </div>

              {listView === ListView.Today ? <MyDay
                day={Day.Today}
                currentListId={currentListId}
                setCurrentListId={setCurrentListId}
                listView={listView}
                setListView={setListView}
                listsOverlay={listsOverlay}
                setListsOverlay={setListsOverlay}
              /> : null}
              {listView === ListView.Tomorrow ? <MyDay
                day={Day.Tomorrow}
                currentListId={currentListId}
                setCurrentListId={setCurrentListId}
                listView={listView}
                setListView={setListView}
                listsOverlay={listsOverlay}
                setListsOverlay={setListsOverlay}
              /> : null}
              {listView === ListView.Archive ? <Archive
                currentListId={currentListId}
                setCurrentListId={setCurrentListId}
                listView={listView}
                setListView={setListView}
                listsOverlay={listsOverlay}
                setListsOverlay={setListsOverlay} /> : null}


              {listView === ListView.History ? <History /> : null}

              {!listView && currentListId && <TaskSection
                currentListId={currentListId}
                setCurrentListId={setCurrentListId}
                listView={listView}
                setListView={setListView}
                listsOverlay={listsOverlay}
                setListsOverlay={setListsOverlay} />}
            </div>
          </div>
        </div >
      )
      }
    </>
  )
}
