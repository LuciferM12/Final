import React, { useState, useRef, useEffect } from 'react'

export default function LineNumberedInput({ code, setCode }) {

  const [lines, setLines] = useState(['1'])
  const textareaRef = useRef(null)

  const handleTextChange = (e) => {
    const newText = e.target.value
    setCode(newText)
    updateLineNumbers(newText)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cursorPosition = e.currentTarget.selectionStart
      const textBeforeCursor = code.slice(0, cursorPosition)
      const textAfterCursor = code.slice(cursorPosition)
      const newText = textBeforeCursor + '\n' + textAfterCursor
      setCode(newText)
      updateLineNumbers(newText)

      // Set cursor position after the new line
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = cursorPosition + 1
          textareaRef.current.selectionEnd = cursorPosition + 1
        }
      }, 0)
    }
  }

  const updateLineNumbers = (newText) => {
    const lineCount = newText.split('\n').length
    setLines(Array.from({ length: lineCount }, (_, i) => (i + 1).toString()))
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [code])

  return (
    <div className="flex border border-gray-950 dark:border-gray-300 rounded-md overflow-hidden h-96">
      <div className="dark:bg-gray-900 bg-gray-100 p-2 text-right dark:text-gray-300 text-gray-500 select-none">
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="flex-grow dark:bg-gray-700 p-2 outline-none resize-none overflow-hidden"
        rows={lines.length}
        style={{ minHeight: '100px' }}
      />
    </div>
  )
}