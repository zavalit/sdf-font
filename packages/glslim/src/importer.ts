import {Program, FunctionDeclaration, FunctionCall, QualifiedVariableDeclaration, DefineDeclaration, PrecisionQualifierDeclaration} from './parser'
import {ImportDeclaration} from './parser/declarations'

import path from 'path'
import fs from 'fs'
import { Parser, Serializer } from '.';

function extractPackagePath(path) {
  const parts = path.split('/');
  if (parts[0].startsWith('@')) {
      // Scoped package: include the first two parts
      const [orgName, packageName, ...relativePath] = parts
      return { 
        packageName: `${orgName}/${packageName}`,
        relativePath: relativePath.join('/')
      }
  } else {
      // Non-scoped package: the first part is the package name
      const [packageName, ...relativePath] = parts
      return { 
        packageName,
        relativePath: relativePath.join('/')
      }
  }
}

const readSrc = (src, dstDir) => {
  if (src.startsWith('.')) {
    const filePath = path.join(dstDir, src)
    return fs.readFileSync(filePath, 'utf8');
  } 
    
  const {packageName, relativePath} = extractPackagePath(src)
  
  const packageMainFile = require.resolve(packageName);
  const packageDirectory = path.dirname(packageMainFile);

  // Construct the full path to the desired file
    const filePath = path.join(packageDirectory, relativePath);

  // // Read the file
  const data = fs.readFileSync(filePath, 'utf8');
  
  return data
  
}

type IndexedDecl = [number, ImportDeclaration]
type IndexedFunctionDecl = [number, FunctionDeclaration]
const Importer = ({
  filterImportDeclarations (ast: Program){
    const importDecls: IndexedDecl[] = 
    ast.body.map((d, index):IndexedDecl => [index, d]).filter((d) => {
      
      return (d[1] instanceof ImportDeclaration)
    })
    return importDecls;
  }, 
  findPrecicionDeclIndex (ast: Program) {
    const index = ast.body.findIndex((d) => (d instanceof PrecisionQualifierDeclaration))
    return index;
  },
  import(dstCode: string, dirname: string) {
    
    const dstAST = Parser.tokenize(dstCode).parseProgram({})
    const importIndexedDecls = this.filterImportDeclarations(dstAST)

    const resultAST = dstAST.clone()
    const destVars = resultAST.body.filter(v => (v.constructor === QualifiedVariableDeclaration))
    const srcVars = []

    const destDefs = resultAST.body.filter(v => v.constructor === DefineDeclaration)
    const srcDefs = []

    
    const importDeclsStmts: IndexedFunctionDecl[] = []

    // Resolve the path to the package's main file
    importIndexedDecls.forEach((decl: IndexedDecl)=> {

      const {src, functionNames} = decl[1]
      const desctIndex = decl[0]
    
      const code = readSrc(src, dirname)

      const depFunctions = new Set()
      

      const srcAST = Parser.tokenize(code).parseProgram({
        expressionEffects: [
          // deps functions
          (expr, node) => {          
            if(expr.constructor === FunctionCall && node.constructor === FunctionDeclaration) {

              if(functionNames.includes(node.name)) {
                depFunctions.add(expr.name)
              }
              
            }
          },
          (expr) => {
            if(expr.constructor === QualifiedVariableDeclaration) { 
              
              const v = [...srcVars, ...destVars].find(v => v.name === expr.name)
              if(!v) {
                srcVars.push(expr)
              }
            }
          },
          (expr) => {
            if(expr.constructor === DefineDeclaration) {
              const v = [...srcDefs, ...destDefs].find(v => v.ident === expr.ident)
              if(!v) {
                srcDefs.push(expr)
              }
            }
          }
        ]
      })

      

      // add functions
      const decls = [...functionNames, ...Array.from(depFunctions)]
      const declsStmts = srcAST.body.filter(n => (n.constructor === FunctionDeclaration) && decls.includes(n.name))
      declsStmts.forEach(decl => {
        importDeclsStmts.push([desctIndex, decl])  
      })
            
    })

   
    if (importDeclsStmts.length > 0) {
      
      importDeclsStmts.reduce((acc, [dstInex, f]) => {      
        resultAST.addNode(f, dstInex + acc)
        return acc + 1
      }, 0)

      
      // add global scope variables
      const pIndex = this.findPrecicionDeclIndex(resultAST)
      const lastVarPos = srcVars.reduce((acc, v) => {
        resultAST.addNode(v, acc)
        return acc + 1      
      }, pIndex + 1)

      // add definitions
      srcDefs.reduce((acc, v, i) => {
        resultAST.addNode(v, acc) 
        return acc + 1
      }, lastVarPos)


    }
   

    return Serializer(resultAST.ast)




  },

})


export default Importer