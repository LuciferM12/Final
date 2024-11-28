import React, { useState, useRef, useEffect } from 'react'

export default function LineNumberedInput() {
  const [text, setText] = useState('')
  const [lines, setLines] = useState(['1'])
  const textareaRef = useRef(null)

  const handleTextChange = (e) => {
    const newText = e.target.value
    setText(newText)
    updateLineNumbers(newText)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cursorPosition = e.currentTarget.selectionStart
      const textBeforeCursor = text.slice(0, cursorPosition)
      const textAfterCursor = text.slice(cursorPosition)
      const newText = textBeforeCursor + '\n' + textAfterCursor
      setText(newText)
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
  }, [text])

  return (
    <div className="flex border border-gray-300 rounded-md overflow-hidden">
      <div className="bg-gray-100 p-2 text-right text-gray-500 select-none">
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="flex-grow text-black p-2 outline-none resize-none overflow-hidden"
        rows={lines.length}
        style={{ minHeight: '100px' }}
      />
    </div>
  )
}