import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from "react-icons/fa6";
import LineNumberedInput from './components/LineNumberedInput';

function App() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen w-screen dark:bg-gray-900 dark:text-white box-border overflow-hidden`}>
      <button onClick={() => setDarkMode(!darkMode)} className='text-3xl absolute top-2 right-2'>
        {
          !darkMode ?
            <FaMoon className='text-gray-900' /> :
            <FaSun className='text-yellow-300' />

        }
      </button>
      <div className='h-full w-full justify-center items-center flex flex-col gap-2'>
        <h1 className='text-2xl font-bold'>Compilador en linea</h1>
        <div className='w-full px-12 py-4'>
          <LineNumberedInput />
        </div>
        <div className='w-full px-12'>
          <h2 className='pb-3'>Consola</h2>
          <textarea
            className='outline-none resize-none w-full rounded-md dark:bg-gray-700 h-24 p-3 '
            disabled
          />
        </div>

      </div>
    </div>
  )
}

export default App
