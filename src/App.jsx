import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from "react-icons/fa6"
import LineNumberedInput from './components/LineNumberedInput'
import { Lexer, EmbeddedActionsParser, createToken } from 'chevrotain'

const Number = createToken({ name: "Number", pattern: /\d+(\.\d+)?/, line_breaks: true, })
const Plus = createToken({ name: "Plus", pattern: /\+/ })
const Minus = createToken({ name: "Minus", pattern: /-/ })
const Multiply = createToken({ name: "Multiply", pattern: /\*/ })
const Divide = createToken({ name: "Divide", pattern: /\// })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/, line_breaks: true, })
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const tokens = [WhiteSpace, Number, Plus, Minus, Multiply, Divide, LParen, RParen]
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
        {
          ALT: () => {
            const esNegativo = $.OPTION(() => $.CONSUME(Minus)) // Detecta el signo negativo
            const numberToken = $.CONSUME(Number) // Consume el número flotante o entero
            const value = parseFloat(numberToken.image) // Convierte el token a un número flotante
            return esNegativo ? -value : value // Devuelve el valor con el signo correcto
          }
        },
        { ALT: () => $.SUBRULE($.expresionParentesis) }, // Maneja expresiones entre paréntesis
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
  const [result, setResult] = useState('')
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleCompile = () => {
    setResult('') // Limpia la consola
    try {
      const lines = code.split("\n") // Divide el código en líneas
      
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trim() // Obtiene la línea actual
        if (!line) continue // Ignora líneas vacías
  
        try {
          // Tokeniza la línea
          const resultadoLexico = lexer.tokenize(line)
  
          if (resultadoLexico.errors.length > 0) {
            throw new Error(`Error léxico en línea ${index + 1}: ${resultadoLexico.errors[0].message}`)
          }
  
          // Genera el AST para la línea
          parserInstance.input = resultadoLexico.tokens
          const astResult = parserInstance.expresion()
  
          if (parserInstance.errors.length > 0) {
            throw new Error(`Error sintáctico en línea ${index + 1}: ${parserInstance.errors[0].message}`)
          }
  
          // Evalúa el AST y almacena el resultado
          const evaluationResult = evaluate(astResult)
          setResult((prevResult) => prevResult + `Línea ${index + 1}: Resultado = ${evaluationResult}\n`)
        } catch (error) {
          // Lanza el error y detiene la ejecución
          throw new Error(`Línea ${index + 1}: ${error.message}`)
        }
      }
    } catch (error) {
      // Muestra el error y detiene todo
      setResult(error.message)
    }
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
        if (right === 0) throw new Error("Error: División por cero")
        return left / right
      default:
        throw new Error(`Operación desconocida: ${node.type}`)
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
          <div className='border-gray-950 dark:border-gray-300 border rounded-md h-48 mb-3 overflow-y-scroll'>
            <ul className='p-3'>
              {result.split("\n").map((line, index) => (
                <li key={index} className='text-sm'>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={handleCompile} className='p-2 cursor-pointer bg-slate-500 rounded'>
          Compilar
        </button>
      </div>
    </div>
  )
}

export default App