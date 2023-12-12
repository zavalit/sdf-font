import {Program, FunctionDeclaration, FunctionCall, QualifiedVariableDeclaration, DefineDeclaration} from './parser'
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

const Importer = ({
  filterImportDeclarations (ast: Program){
    const importDecls: ImportDeclaration[] = 
    ast.body.filter((d) => (d instanceof ImportDeclaration))
  
    return importDecls;
  }, 
  import(dstCode: string, dirname: string) {
    
    const dstAST = Parser.tokenize(dstCode).parseProgram({})
    const importDecls = this.filterImportDeclarations(dstAST)

    const resultAST = dstAST.clone()
    
    const destVars = resultAST.body.filter(v => v.constructor === QualifiedVariableDeclaration)
    const srcVars = []

    const destDefs = resultAST.body.filter(v => v.constructor === DefineDeclaration)
    const srcDefs = []

    const importDeclsStmts = []

    // Resolve the path to the package's main file
    importDecls.forEach((decl: ImportDeclaration)=> {

      const {src, functionNames} = decl
    
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
      importDeclsStmts.push(...declsStmts)

      
      
    }
    )

    if (importDeclsStmts.length > 0) {
      // add imported functions
      importDecls.forEach(decl => {
        const declIndex = resultAST.body.findIndex((_decl: ImportDeclaration) => decl === _decl) || 1
        resultAST.removeNode(declIndex)
        
        const amount = decl.functionNames.length
        const declToImport = importDeclsStmts.slice(0, amount)
        importDeclsStmts.splice(0, amount)
        declToImport.forEach((f, i) => {
          resultAST.addNode(f)
        })
      })


      // add definitions
      srcDefs.forEach((v, i) => {
        resultAST.addNode(v, i+1)      
      })

      // add global scope variables
      srcVars.forEach((v, i) => {
        resultAST.addNode(v, i+1)      
      })

    }
   

    return Serializer(resultAST.ast)




  },

})


export default Importer