import fixtureGlsl from './fixture.glsl'
import {Parser, Serializer, Importer} from '../src'
import util from 'util'
const mock = require('mock-fs');
const fs = require('fs')
const path = require('path')


describe('Importer', () => {

  // it('should build AST with struct and serialize', () => {


  //   const code = fixtureGlsl.glslStuct
  //   const AST = Parser.tokenize(code).parseProgram('importer').ast
    
  //   //console.log('AST', util.inspect(AST, {showHidden: false, depth: null, colors: false}))
  //   const serializedAST =  Serializer(AST);
    

  //   const nonNewLineCode = code.split(`\n`).filter(w => w !== "").filter(w => (w !== `  ` && w !== `    `))
  //   const serializedASTArray = serializedAST.split(`\n`);

  //   expect(serializedASTArray).toEqual(nonNewLineCode)
  // })


  // it('should import', () => {


  //   const dstResultCode = fixtureGlsl.dstResult
  //   const dstCode = fixtureGlsl.dst

  //   // const srcCode = fixtureGlsl.src
  //   // const srcP = Parser.tokenize(srcCode).parseProgram()
  //   const code = Importer.import(dstCode, __dirname)
    
  //   // const AST = Importer.importAST(dstP, srcP).ast
    
  //   const nonNewLineCode = code.split(`\n`).filter(w => w !== "").filter(w => (w !== `  ` && w !== `    `))
  //   const serializedASTArray = dstResultCode.split(`\n`);

  //   expect(serializedASTArray).toEqual(nonNewLineCode)

  // })

  // // it('should import webglify glsl', () => {
  // //   const dstCode = fixtureGlsl.webglifyGlsl
    
  // //   const code = Importer.import(dstCode, __dirname)
    
  // //   console.log('code', code)


  // // })

  // it('should parse and serialize', () => {
  //   const code = fixtureGlsl.glsl
  //   const AST = Parser.tokenize(code).parseProgram({}).ast
  //   const serializedAST =  Serializer(AST);

  //   const nonNewLineCode = code.split(`\n`).filter(w => w !== "").filter(w => (w !== `  ` && w !== `    `))
  //   const serializedASTArray = serializedAST.split(`\n`);
  //   console.log('serializedASTArray', serializedASTArray)

  //   expect(serializedASTArray).toEqual(nonNewLineCode)
  // })



  it('should import', () => {
      const dstCode = fixtureGlsl.glslImportFragmentRequester
      const code = Importer.import(dstCode, __dirname)

      expect(code).toEqual(fixtureGlsl.glslImportFragmentResult)
  })
})

