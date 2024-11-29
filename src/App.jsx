import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from "react-icons/fa6"
import LineNumberedInput from './components/LineNumberedInput'
import { Lexer, EmbeddedActionsParser, createToken } from 'chevrotain'

const Pinta = createToken({ name: "Pinta", pattern: /pinta/ })
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/, longer_alt: Pinta })
const Number = createToken({ name: "Number", pattern: /\d+(\.\d+)?/, line_breaks: true })
const Plus = createToken({ name: "Plus", pattern: /\+/ })
const Minus = createToken({ name: "Minus", pattern: /-/ })
const Multiply = createToken({ name: "Multiply", pattern: /\*/ })
const Divide = createToken({ name: "Divide", pattern: /\// })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/ })
const If = createToken({ name: "If", pattern: /if/, longer_alt: Identifier })
const Then = createToken({ name: "Then", pattern: /then/, longer_alt: Identifier })
const Else = createToken({ name: "Else", pattern: /else/, longer_alt: Identifier })
const Equals = createToken({ name: "Equals", pattern: /==/ })
const LessThan = createToken({ name: "LessThan", pattern: /</ })
const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ })
const LBrace = createToken({ name: "LBrace", pattern: /{/ })
const RBrace = createToken({ name: "RBrace", pattern: /}/ })
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ })
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const tokens = [
  WhiteSpace, Number, Plus, Minus, Multiply, Divide, LParen, RParen,
  If, Then, Else, Pinta, Identifier, Equals, LessThan, GreaterThan,
  LBrace, RBrace, Semicolon
]
const lexer = new Lexer(tokens)

class CalcularParser extends EmbeddedActionsParser {
  constructor() {
    super(tokens)

    const $ = this

    $.RULE("programa", () => {
      const statements = []
      $.MANY(() => {
        statements.push($.SUBRULE($.statement))
      })
      return { type: "Program", body: statements }
    })

    $.RULE("statement", () => {
      return $.OR([
        { ALT: () => $.SUBRULE($.ifStatement) },
        { ALT: () => $.SUBRULE($.expressionStatement) },
        { ALT: () => $.SUBRULE($.pintaStatement) }
      ])
    })

    $.RULE("ifStatement", () => {
      $.CONSUME(If)
      const condition = $.SUBRULE($.comparacion)
      $.OPTION(() => $.CONSUME(Then))
      const thenBlock = $.SUBRULE($.block)
      const elseBlock = $.OPTION2(() => {
        $.CONSUME(Else)
        return $.SUBRULE2($.block)
      })
      return { type: "If", condition, thenBlock, elseBlock }
    })

    $.RULE("block", () => {
      const statements = []
      $.OR([
        {
          ALT: () => {
            $.CONSUME(LBrace)
            $.MANY(() => {
              statements.push($.SUBRULE($.statement))
            })
            $.CONSUME(RBrace)
          }
        },
        {
          ALT: () => {
            statements.push($.SUBRULE2($.statement))
          }
        }
      ])
      return { type: "Block", body: statements }
    })

    $.RULE("expressionStatement", () => {
      const expr = $.SUBRULE($.expresion)
      $.CONSUME(Semicolon)
      return { type: "ExpressionStatement", expression: expr }
    })

    $.RULE("pintaStatement", () => {
      $.CONSUME(Pinta)
      $.CONSUME(LParen)
      const expr = $.SUBRULE($.expresion)
      $.CONSUME(RParen)
      $.CONSUME(Semicolon)
      return { type: "Pinta", expression: expr }
    })

    $.RULE("expresion", () => {
      return $.SUBRULE($.expresionAdicion)
    })

    $.RULE("comparacion", () => {
      const left = $.SUBRULE($.expresionAdicion)
      const operator = $.OR([
        { ALT: () => $.CONSUME(Equals).image },
        { ALT: () => $.CONSUME(LessThan).image },
        { ALT: () => $.CONSUME(GreaterThan).image }
      ])
      const right = $.SUBRULE2($.expresionAdicion)
      return { type: "Comparison", left, operator, right }
    })

    $.RULE("expresionAdicion", () => {
      let result = $.SUBRULE($.expresionMultiplicacion)
      $.MANY(() => {
        const operador = $.OR([
          { ALT: () => $.CONSUME(Plus).image },
          { ALT: () => $.CONSUME(Minus).image },
        ])
        const rhs = $.SUBRULE2($.expresionMultiplicacion)
        result = { type: operador === '+' ? "Add" : "Subtract", left: result, right: rhs }
      })
      return result
    })

    $.RULE("expresionMultiplicacion", () => {
      let result = $.SUBRULE($.expresionAtomica)
      $.MANY(() => {
        const operator = $.OR([
          { ALT: () => $.CONSUME(Multiply).image },
          { ALT: () => $.CONSUME(Divide).image },
        ])
        const rhs = $.SUBRULE2($.expresionAtomica)
        result = { type: operator === "*" ? "Multiply" : "Divide", left: result, right: rhs }
      })
      return result
    })

    $.RULE("expresionAtomica", () => {
      return $.OR([
        {
          ALT: () => {
            const esNegativo = $.OPTION(() => $.CONSUME(Minus))
            const numberToken = $.CONSUME(Number)
            const value = parseFloat(numberToken.image)
            return esNegativo ? -value : value
          }
        },
        { ALT: () => $.SUBRULE($.expresionParentesis) },
        { ALT: () => $.CONSUME(Identifier) },
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleCompile = () => {
    setResult('')
    try {
      const resultadoLexico = lexer.tokenize(code)

      if (resultadoLexico.errors.length > 0) {
        throw new Error(`Error léxico: ${resultadoLexico.errors[0].message}`)
      }

      // Genera el AST para todo el programa
      parserInstance.input = resultadoLexico.tokens
      const astResult = parserInstance.programa()

      if (parserInstance.errors.length > 0) {
        throw new Error(`Error sintáctico: ${parserInstance.errors[0].message}`)
      }

      // Evalúa el AST y almacena el resultado
      const evaluationResult = evaluate(astResult)
      setResult(evaluationResult.flat().filter(r => r !== undefined).join('\n'))
    } catch (error) {
      // Muestra el error y detiene todo
      setResult(`Error: ${error.message}`)
    }
  }

  const evaluate = (node) => {
    if (typeof node === "number") return [];
    if (typeof node === "object" && node.image) return [];

    switch (node.type) {
      case "Program":
        return node.body.flatMap(evaluate);
      case "ExpressionStatement":
        return evaluate(node.expression);
      case "Block":
        return node.body.flatMap(evaluate);
      case "If":
        if (evaluateComparison(node.condition)) {
          return evaluate(node.thenBlock);
        } else if (node.elseBlock) {
          return evaluate(node.elseBlock);
        }
        return [];
      case "Add":
      case "Subtract":
      case "Multiply":
      case "Divide":
      case "Comparison":
        return []; // No imprimimos estos resultados
      case "Pinta":
        const value = evaluateExpression(node.expression);
        return [`${value}`];
      default:
        throw new Error(`Operación desconocida: ${node.type}`);
    }
  };

  const evaluateExpression = (node) => {
    if (typeof node === "number") return node;
    if (typeof node === "object" && node.image) return parseFloat(node.image);

    switch (node.type) {
      case "Add":
        return evaluateExpression(node.left) + evaluateExpression(node.right);
      case "Subtract":
        return evaluateExpression(node.left) - evaluateExpression(node.right);
      case "Multiply":
        return evaluateExpression(node.left) * evaluateExpression(node.right);
      case "Divide":
        const divisor = evaluateExpression(node.right);
        if (divisor === 0) throw new Error("Error: División por cero");
        return evaluateExpression(node.left) / divisor;
      case "Comparison":
        return evaluateComparison(node);
      default:
        throw new Error(`Operación desconocida: ${node.type}`);
    }
  };

  const evaluateComparison = (node) => {
    const left = evaluateExpression(node.left);
    const right = evaluateExpression(node.right);
    switch (node.operator) {
      case "==":
        return left === right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      default:
        throw new Error(`Operador de comparación desconocido: ${node.operator}`);
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
        <h1 className='text-2xl font-bold'>Compilador en línea</h1>
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