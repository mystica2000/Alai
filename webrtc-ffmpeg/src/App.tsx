import './App.css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import Record from './layouts/Record'
import ServerStatus from './layouts/ServerStatus'
import Stream from './layouts/Stream'

function App() {

  return (
    <>
      <Tabs defaultValue='record'>
        <div className='flex justify-center'>
          <TabsList>
            <TabsTrigger value='record'>
              Record
            </TabsTrigger>
            <TabsTrigger value='stream'>
              Stream
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='record'>
          <div className='w-100'>
            <div className='flex max-w-[720px] h-[calc(100vh-2em-36px-8px-4em)] mx-auto'>
              <main className="m-2 w-full h-full">
                <ServerStatus />
                <Record />
              </main>
            </div>
          </div>
        </TabsContent>
        <TabsContent value='stream'>
          <div className='w-100'>
            <div className='flex max-w-[720px] h-[calc(100vh-2em-36px-8px-4em)] mx-auto'>
              <main className="m-2 w-full h-full">
                <ServerStatus />
                <Stream />
              </main>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default App
