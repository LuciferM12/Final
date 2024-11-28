import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from "react-icons/fa6"
import LineNumberedInput from './components/LineNumberedInput'
import { Lexer, EmbeddedActionsParser, createToken } from 'chevrotain'

const Number = createToken({ name: "Number", pattern: /\d+/, line_breaks: true, })
const Plus = createToken({ name: "Plus", pattern: /\+/ })
const Minus = createToken({ name: "Minus", pattern: /-/ })
const Multiply = createToken({ name: "Multiply", pattern: /\*/ })
const Divide = createToken({ name: "Divide", pattern: /\// })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/, line_breaks: true, })
const tokens = [Number, Plus, Minus, Multiply, Divide, LParen, RParen]
const lexer = new Lexer(tokens)

class CalcularParser extends EmbeddedActionsParser {
  constructor() {
    super(tokens)

    const $ = this

    $.RULE("expresion", () => $.SUBRULE($.expresionAdicion))

    $.RULE("expresionAdicion", () => {
      let result = $.SUBRULE($.expresionMultiplicacion)
      $.MANY(() => {
        const operador = $.OR([
          { ALT: () => $.CONSUME(Plus).image },
          { ALT: () => $.CONSUME(Minus).image },
        ])
        const rhs = $.SUBRULE2($.expresionMultiplicacion)
        if (operador === '+') {
          result = { type: "Add", left: result, right: rhs }
        } else {
          result = { type: "Subtract", left: result, right: rhs }
        }
      })
      return result
    })

    $.RULE("expresionMultiplicacion", () => {
      let result = $.SUBRULE($.expresionAtomica);
      $.MANY(() => {
        const operator = $.OR([
          { ALT: () => $.CONSUME(Multiply).image },
          { ALT: () => $.CONSUME(Divide).image },
        ]);
        const rhs = $.SUBRULE2($.expresionAtomica)
        if (operator === "*") {
          result = { type: "Multiply", left: result, right: rhs }
        } else {
          result = { type: "Divide", left: result, right: rhs }
        }
      })
      return result
    })

    $.RULE("expresionAtomica", () => {
      return $.OR([
        { ALT: () => parseInt($.CONSUME(Number).image, 10) },
        { ALT: () => $.SUBRULE($.expresionParentesis) },
      ])
    })

    $.RULE("expresionParentesis", () => {
      $.CONSUME(LParen)
      const result = $.SUBRULE($.expresion)
      $.CONSUME(RParen)
      return result
    })

    this.performSelfAnalysis()
  }
}

const parserInstance = new CalcularParser()

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleCompile = () => {
    const resultadoLexico = lexer.tokenize(code)
    setTokens(resultadoLexico.tokens.map((token) => token.image))

    parserInstance.input = resultadoLexico.tokens
    const astResult = parserInstance.expresion()
    
    // Ejecución del código 
    setResult(evaluate(astResult))
  }

  const evaluate = (node) => {
    if (typeof node === "number") return node;
    const left = evaluate(node.left)
    const right = evaluate(node.right)
    switch (node.type) {
      case "Add":
        return left + right
      case "Subtract":
        return left - right
      case "Multiply":
        return left * right
      case "Divide":
        return left / right
      default:
        return null
    }
  }

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
          <LineNumberedInput setCode={setCode} code={code} />
        </div>
        <div className='w-full px-12'>
          <h2 className='pb-3'>Consola</h2>
          <textarea
            className='outline-none resize-none w-full rounded-md dark:bg-gray-700 h-24 p-3 '
            disabled
            value={result || ''}
          />
        </div>
        <button onClick={handleCompile} className='p-2 cursor-pointer bg-slate-500 rounded '>
          Compilar
        </button>

      </div>
    </div>
  )
}

export default App
