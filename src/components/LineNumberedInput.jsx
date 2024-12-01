import React, { useState, useRef, useEffect } from 'react'

export default function LineNumberedInput({ code, setCode }) {
  const [lines, setLines] = useState(['1'])
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)

  const handleTextChange = (e) => {
    const newText = e.target.value
    setCode(newText)
    updateLineNumbers(newText)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const cursorPosition = e.currentTarget.selectionStart
      const textBeforeCursor = code.slice(0, cursorPosition)
      const textAfterCursor = code.slice(cursorPosition)
      const newText = textBeforeCursor + '  ' + textAfterCursor
      setCode(newText)

      // Set cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = cursorPosition + 2
          textareaRef.current.selectionEnd = cursorPosition + 2
        }
      }, 0)
    }
  }

  const updateLineNumbers = (newText) => {
    const lineCount = newText.split('\n').length
    setLines(Array.from({ length: lineCount }, (_, i) => (i + 1).toString()))
  }

  const handleScroll = () => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  useEffect(() => {
    updateLineNumbers(code)
  }, [code])

  return (
    <div className="flex border border-gray-950 dark:border-gray-300 rounded-md overflow-hidden h-96">
      <div
        ref={lineNumbersRef}
        className="dark:bg-gray-900 bg-gray-100 p-2 text-right dark:text-gray-300 text-gray-500 select-none overflow-hidden"
        style={{ width: '3em' }}
      >
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        className="flex-grow dark:bg-gray-700 p-2 outline-none resize-none overflow-y-scroll"
        style={{ minHeight: '100%' }}
        spellCheck={false}
      />
    </div>
  )
}

