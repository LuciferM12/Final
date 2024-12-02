import { useState, useEffect, useRef } from 'react'
import { FaSun, FaMoon } from "react-icons/fa6"
import { FaAngleRight, FaAngleDown, FaFolderOpen, FaPlay, FaSave } from "react-icons/fa"
import { VscNewFile } from "react-icons/vsc"
import LineNumberedInput from './components/LineNumberedInput'
import ASTVisualization from './components/ASTVisualization'
import { Lexer, EmbeddedActionsParser, createToken } from 'chevrotain'

const Pinta = createToken({ name: "Pinta", pattern: /pinta/ })
const Let = createToken({ name: "Let", pattern: /eureka/ })
const Fn = createToken({ name: "Fn", pattern: /task/ })
const Return = createToken({ name: "Return", pattern: /return/ })
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/, longer_alt: Pinta })
const Number = createToken({ name: "Number", pattern: /\d+(\.\d+)?/, line_breaks: true })
const String = createToken({ name: "String", pattern: /"(?:[^"\\]|\\.)*"/ })
const Plus = createToken({ name: "Plus", pattern: /\+/ })
const Minus = createToken({ name: "Minus", pattern: /-/ })
const Multiply = createToken({ name: "Multiply", pattern: /\*/ })
const Divide = createToken({ name: "Divide", pattern: /\// })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/ })
const If = createToken({ name: "If", pattern: /si/, longer_alt: Identifier })
const Then = createToken({ name: "Then", pattern: /entonces/, longer_alt: Identifier })
const Else = createToken({ name: "Else", pattern: /no/, longer_alt: Identifier })
const Equals = createToken({ name: "Equals", pattern: /==/ })
const NotEquals = createToken({ name: "NotEquals", pattern: /!=/ })
const LessThanOrEqual = createToken({ name: "LessThanOrEqual", pattern: /<=/ })
const GreaterThanOrEqual = createToken({ name: "GreaterThanOrEqual", pattern: />=/ })
const LessThan = createToken({ name: "LessThan", pattern: /</ })
const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ })
const LBrace = createToken({ name: "LBrace", pattern: /{/ })
const RBrace = createToken({ name: "RBrace", pattern: /}/ })
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const While = createToken({ name: "While", pattern: /mientras/ })
const Do = createToken({ name: "Do", pattern: /repite/ })
const Assign = createToken({ name: "Assign", pattern: /=/ })
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const tokens = [
  WhiteSpace, Number, String, Plus, Minus, Multiply, Divide, LParen, RParen,
  If, Then, Else, Pinta, Let, Fn, While, Do, Return, Identifier,
  Equals, NotEquals, LessThanOrEqual, GreaterThanOrEqual, LessThan, GreaterThan,
  Assign, LBrace, RBrace, Semicolon, Comma,
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
        { ALT: () => $.SUBRULE($.whileStatement) },
        { ALT: () => $.SUBRULE($.functionDeclaration) },
        { ALT: () => $.SUBRULE($.returnStatement) },
        { ALT: () => $.SUBRULE($.expressionStatement) },
        { ALT: () => $.SUBRULE($.pintaStatement) },
        { ALT: () => $.SUBRULE($.variableDeclaration) },
      ])
    })

    $.RULE("functionDeclaration", () => {
      $.CONSUME(Fn)
      const name = $.CONSUME(Identifier).image
      $.CONSUME(LParen)
      const params = []
      $.OPTION(() => {
        params.push($.CONSUME2(Identifier).image)
        $.MANY(() => {
          $.CONSUME(Comma)
          params.push($.CONSUME3(Identifier).image)
        })
      })
      $.CONSUME(RParen)
      const body = $.SUBRULE($.block)
      return { type: "FunctionDeclaration", name, params, body }
    })

    $.RULE("returnStatement", () => {
      $.CONSUME(Return)
      const argument = $.SUBRULE($.expresion)
      $.CONSUME(Semicolon)
      return { type: "ReturnStatement", argument }
    })

    $.RULE("whileStatement", () => {
      $.CONSUME(While)
      const condition = $.SUBRULE($.comparacion)
      $.CONSUME(Do)
      const body = $.SUBRULE($.block)
      return { type: "While", condition, body }
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

    $.RULE("variableDeclaration", () => {
      $.CONSUME(Let)
      const name = $.CONSUME(Identifier).image
      $.CONSUME(Assign)
      const initialValue = $.SUBRULE($.expresion)
      $.CONSUME(Semicolon)
      return { type: "VariableDeclaration", name, initialValue }
    })

    $.RULE("expresion", () => {
      return $.SUBRULE($.expresionAsignacion)
    })

    $.RULE("expresionAsignacion", () => {
      let left = $.SUBRULE($.expresionAdicion)
      $.OPTION(() => {
        $.CONSUME(Assign)
        const right = $.SUBRULE2($.expresionAsignacion)
        left = { type: "Assign", left, right }
      })
      return left
    })

    $.RULE("comparacion", () => {
      const left = $.SUBRULE($.expresionAdicion)
      const operator = $.OR([
        { ALT: () => $.CONSUME(Equals).image },
        { ALT: () => $.CONSUME(NotEquals).image },
        { ALT: () => $.CONSUME(LessThanOrEqual).image },
        { ALT: () => $.CONSUME(GreaterThanOrEqual).image },
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
        { ALT: () => $.SUBRULE($.callExpression) },
        { ALT: () => ({ type: "Identifier", name: $.CONSUME(Identifier).image }) },
        { ALT: () => ({ type: "String", value: $.CONSUME(String).image.slice(1, -1) }) },
      ])
    })

    $.RULE("callExpression", () => {
      const callee = $.CONSUME(Identifier)
      $.CONSUME(LParen)
      const args = []
      $.OPTION(() => {
        args.push($.SUBRULE($.expresion))
        $.MANY(() => {
          $.CONSUME(Comma)
          args.push($.SUBRULE2($.expresion))
        })
      })
      $.CONSUME(RParen)
      return { type: "CallExpression", callee: callee.image, arguments: args }
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
  const [isVisibleBytCode, setIsVisibleBytCode] = useState(false)
  const [isVisibleAstCode, setIsVisibleAstCode] = useState(false)
  const [code, setCode] = useState('')
  const [result, setResult] = useState('')
  const [bytecode, setBytecode] = useState('')
  const [ast, setAst] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleCompile = () => {
    setResult('')
    setBytecode('')
    setAst(null)
    try {
      const resultadoLexico = lexer.tokenize(code)

      if (resultadoLexico.errors.length > 0) {
        throw new Error(`Error léxico: ${resultadoLexico.errors[0].message}`)
      }

      parserInstance.input = resultadoLexico.tokens
      const astResult = parserInstance.programa()

      if (parserInstance.errors.length > 0) {
        throw new Error(`Error sintáctico: ${parserInstance.errors[0].message}`)
      }

      setAst(astResult)

      const bytecodeInstructions = generateBytecode(astResult);
      setBytecode(bytecodeInstructions.join('\n'));

      const outputBuffer = [];
      const printFunction = (value) => {
        outputBuffer.push(value);
        setResult(prev => prev + (prev ? '\n' : '') + value);
      };

      evaluate(astResult, { variables: {}, functions: {}, print: printFunction });

    } catch (error) {
      setResult(`Error: ${error.message}`)
    }
  }

  const handleNew = () => {
    setCode('')
    setResult('')
    setBytecode('')
    setAst(null)
  }

  const handleOpen = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCode(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleSave = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code.art'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const evaluate = (node, context = { variables: {}, functions: {}, print: console.log }, localContext = null) => {
    const currentContext = localContext || context;
    let returnValue;

    const evaluateNode = (node) => {
      if (typeof node === "number") return node;
      if (typeof node === "object" && node.image) return node.image;

      switch (node.type) {
        case "Program":
          for (let stmt of node.body) {
            const result = evaluateNode(stmt);
            if (result && result.hasOwnProperty('returnValue')) {
              return result;
            }
          }
          break
        case "ExpressionStatement":
          return evaluateNode(node.expression);
        case "Block":
          for (let stmt of node.body) {
            const result = evaluateNode(stmt);
            if (result && result.hasOwnProperty('returnValue')) {
              return result;
            }
          }
          break;
        case "If":
          if (evaluateExpression(node.condition, context, currentContext)) {
            return evaluateNode(node.thenBlock)
          } else if (node.elseBlock) {
            return evaluateNode(node.elseBlock)
          }
          break
        case "While":
          let iterationCount = 0;
          const maxIterations = 1000;
          while (evaluateExpression(node.condition, context, currentContext)) {
            const result = evaluateNode(node.body)
            if (result && result.hasOwnProperty('returnValue')) {
              return result
            }
            iterationCount++
            if (iterationCount > maxIterations) {
              throw new Error("Error: bucle infinito detectado.")
            }
          }
          break
        case "VariableDeclaration":
          currentContext.variables[node.name] = evaluateExpression(node.initialValue, context, currentContext);
          break
        case "FunctionDeclaration":
          context.functions[node.name] = { params: node.params, body: node.body };
          break
        case "ReturnStatement":
          return { returnValue: evaluateExpression(node.argument, context, currentContext) };
        case "Pinta":
          const value = evaluateExpression(node.expression, context, currentContext);
          context.print(value)
          break
        case "CallExpression":
          return evaluateCallExpression(node, context, currentContext)
        default:
          return evaluateExpression(node, context, currentContext)
      }
    };

    const result = evaluateNode(node)
    return result && result.hasOwnProperty('returnValue') ? result : { returnValue };
  }

  const evaluateExpression = (node, context, localContext) => {
    if (typeof node === "number") return node

    switch (node.type) {
      case "Add":
        return evaluateExpression(node.left, context, localContext) + evaluateExpression(node.right, context, localContext)
      case "Subtract":
        return evaluateExpression(node.left, context, localContext) - evaluateExpression(node.right, context, localContext)
      case "Multiply":
        return evaluateExpression(node.left, context, localContext) * evaluateExpression(node.right, context, localContext)
      case "Divide":
        const divisor = evaluateExpression(node.right, context, localContext)
        if (divisor === 0) throw new Error("Error: División por cero")
        return evaluateExpression(node.left, context, localContext) / divisor
      case "Comparison":
        return evaluateComparison(node, context, localContext)
      case "Assign":
        if (node.left.type !== "Identifier") {
          throw new Error("Solo se puede asignar a identificadores")
        }
        const value = evaluateExpression(node.right, context, localContext)
        if (localContext.variables.hasOwnProperty(node.left.name)) {
          localContext.variables[node.left.name] = value
        } else {
          context.variables[node.left.name] = value
        }
        return value;
      case "Identifier":
        if (localContext.variables.hasOwnProperty(node.name)) {
          return localContext.variables[node.name]
        }
        if (context.variables.hasOwnProperty(node.name)) {
          return context.variables[node.name]
        }
        throw new Error(`Variable no definida: ${node.name}`)
      case "String":
        return node.value;
      case "CallExpression":
        return evaluateCallExpression(node, context, localContext)
      default:
        throw new Error(`Operación desconocida: ${node.type}`)
    }
  }

  const evaluateComparison = (node, context, localContext) => {
    const left = evaluateExpression(node.left, context, localContext)
    const right = evaluateExpression(node.right, context, localContext)
    switch (node.operator) {
      case "==":
        return left === right
      case "!=":
        return left !== right
      case "<":
        return left < right
      case "<=":
        return left <= right
      case ">":
        return left > right
      case ">=":
        return left >= right
      default:
        throw new Error(`Operador de comparación desconocido: ${node.operator}`)
    }
  }

  const evaluateCallExpression = (node, context, localContext) => {
    const func = context.functions[node.callee]
    if (!func) {
      throw new Error(`Función no definida: ${node.callee}`)
    }
    if (func.params.length !== node.arguments.length) {
      throw new Error(`Número incorrecto de argumentos para la función ${node.callee}. Esperados: ${func.params.length}, Recibidos: ${node.arguments.length}`);
    }
    const args = node.arguments.map(arg => evaluateExpression(arg, context, localContext));
    const functionLocalContext = {
      variables: {},
      functions: context.functions,
      print: context.print
    };
    func.params.forEach((param, index) => {
      functionLocalContext.variables[param] = args[index]
    });
    const result = evaluate(func.body, context, functionLocalContext)
    return result.returnValue
  };

  const generateBytecode = (node) => {
    const instructions = []

    const generateForNode = (node) => {
      switch (node.type) {
        case "Program":
          node.body.forEach(generateForNode);
          break;
        case "FunctionDeclaration":
          instructions.push(`FUNCTION ${node.name}`);
          node.params.forEach(param => instructions.push(`PARAM ${param}`))
          generateForNode(node.body)
          instructions.push('RETURN')
          break;
        case "Block":
          node.body.forEach(generateForNode)
          break;
        case "VariableDeclaration":
          instructions.push(`STORE ${node.name}`)
          break;
        case "Pinta":
          instructions.push('CALL pinta')
          break;
        case "If":
          generateForNode(node.condition)
          instructions.push('JUMP_IF_FALSE else')
          generateForNode(node.thenBlock)
          instructions.push('JUMP end')
          instructions.push('LABEL else')
          if (node.elseBlock) {
            generateForNode(node.elseBlock)
          }
          instructions.push('LABEL end')
          break;
        case "While":
          instructions.push('LABEL loop_start')
          generateForNode(node.condition)
          instructions.push('JUMP_IF_FALSE loop_end')
          generateForNode(node.body);
          instructions.push('JUMP loop_start')
          instructions.push('LABEL loop_end')
          break;
        case "Comparison":
          generateForNode(node.left)
          generateForNode(node.right)
          instructions.push(`COMPARE ${node.operator}`)
          break;
        case "CallExpression":
          node.arguments.forEach(generateForNode)
          instructions.push(`CALL ${node.callee}`)
          break;
        case "ReturnStatement":
          generateForNode(node.argument)
          instructions.push('RETURN')
          break;
        case "Identifier":
          instructions.push(`LOAD ${node.name}`)
          break;
        case "String":
        case "Number":
          instructions.push(`PUSH ${node.value}`)
          break;
      }
    };

    generateForNode(node)
    return instructions
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen w-full dark:bg-gray-900 dark:text-white box-border`}>
      <button onClick={() => setDarkMode(!darkMode)} className='text-3xl fixed top-4 right-4 z-10'>
        {
          !darkMode ?
            <FaMoon className='text-gray-900 bg-gray-200 w-8 h-8 p-1 rounded' /> :
            <FaSun className='text-yellow-300 bg-gray-900 w-8 h-8 p-1 rounded' />
        }
      </button>
      <div className='container mx-auto px-4 py-8 flex flex-col gap-4'>
        <h1 className='text-5xl font-bold text-center mb-7'>Compilador en línea</h1>
        <div className='flex w-full justify-center gap-3'>
          <button onClick={handleNew} className='flex w-[70px] items-center gap-2 text-xs flex-col p-2 cursor-pointer border shadow-sm text-black dark:text-white font-bold rounded transition-colors '>
            <VscNewFile className='text-3xl' /> Nuevo
          </button>
          <button onClick={handleOpen} className='flex w-[70px] items-center gap-2 text-xs flex-col p-2 cursor-pointer border shadow-sm text-black dark:text-white font-bold rounded transition-colors'>
            <FaFolderOpen className='text-3xl' /> Abrir
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".art"
            style={{ display: 'none' }}
          />
          <button onClick={handleCompile} className='flex text-black dark:text-white items-center w-[70px] gap-2 text-xs flex-col p-2 cursor-pointer border shadow-sm  font-bold rounded transition-colors'>
            <FaPlay className='text-3xl' /> Compilar
          </button>
          <button onClick={handleSave} className='flex text-black dark:text-white items-center w-[70px] gap-2 text-xs flex-col p-2 cursor-pointer border shadow-sm  font-bold rounded transition-colors'>
            <FaSave className='text-3xl' /> Guardar
          </button>
        </div>
        <div className='w-full'>
          <LineNumberedInput setCode={setCode} code={code} />
        </div>
        <div className='w-full flex flex-wrap gap-4'>
          <div className='w-full '>
            <h2 className='pb-3'>Consola</h2>
            <div className='border-gray-950 dark:border-gray-300 border rounded-md h-48 overflow-y-auto'>
              <ul className='p-3'>
                {result.split("\n").map((line, index) => (
                  <li key={index} className='text-sm'>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='w-full '>
            <h2 className='pb-3 flex gap-1 items-center' >
              {
                isVisibleBytCode ?
                  <FaAngleDown className='cursor-pointer' onClick={() => setIsVisibleBytCode(!isVisibleBytCode)} /> :
                  <FaAngleRight className='cursor-pointer' onClick={() => setIsVisibleBytCode(!isVisibleBytCode)} />
              }
              Bytecode
            </h2>
            {
              isVisibleBytCode &&
              <div className='border-gray-950 dark:border-gray-300 border rounded-md h-48 overflow-y-auto  md:w-full'>
                <pre className='p-3 text-sm'>
                  {bytecode}
                </pre>
              </div>
            }
          </div>
          <div className='w-full'>
            <h2 className='pb-3 flex gap-1 items-center' >
              {
                isVisibleAstCode ?
                  <FaAngleDown className='cursor-pointer' onClick={() => setIsVisibleAstCode(!isVisibleAstCode)} /> :
                  <FaAngleRight className='cursor-pointer' onClick={() => setIsVisibleAstCode(!isVisibleAstCode)} />
              }
              Visualizador de AST
            </h2>
            {
              isVisibleAstCode &&
              <div className='border-gray-950 dark:border-gray-300 border rounded-md h-[600px] overflow-auto'>
                {ast && <ASTVisualization ast={ast} />}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default App