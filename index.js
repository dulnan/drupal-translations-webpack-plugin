/**
 * DrupalTranslationsWebpackPlugin
 *
 * (c) 2018 by Jan Hug
 * Released under the MIT license.
 *
 */

const fs = require('fs');
const path = require('node:path');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')

const PLUGIN = 'DrupalTranslationsWebpackPlugin'

class DrupalTranslationsWebpackPlugin {
  constructor (options) {
    options = options || {}
    this.output = options.output || 'drupalTranslations.js'
  }

  /**
   * @param {Compiler} compiler 
   */
  apply (compiler) {
    var functionCalls = []
    var output = this.output

    // Tap into the compilation hook and create a new "normalModuleFactory" which we can
    // tap into.
    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.dependencyFactories.set(ConstDependency, new NullFactory())
      compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
    })

    // Now tap again into someting.
    compiler.hooks.normalModuleFactory.tap(PLUGIN, (factory) => {
      // More tapping, now in the parser, for javascript files!
      factory.hooks.parser.for('javascript/auto').tap(PLUGIN, (parser) => {
        // And now tap into calling the Drupal.t functions.
        parser.hooks.call.for('Drupal.t').tap(PLUGIN, (expression) => {
          const expressionString = getExpressionInSource(expression, parser)
          if (expressionString) {
            functionCalls.push(expressionString)
          }
          return false
        })

        // Tap tap for Drupal.formatPlural
        parser.hooks.call.for('Drupal.formatPlural').tap(PLUGIN, (expression) => {
          const expressionString = getExpressionInSource(expression, parser)
          if (expressionString) {
            functionCalls.push(expressionString)
          }
          return false
        })
      })
    })

    // Tap into the emit hook. Happens when all compilation is over and files are written to disk.
    compiler.hooks.emit.tapAsync(PLUGIN, (compilation, callback) => {
      // Remove all newlines from the function calls. Then join the array with new lines and two spaces.
      const functionCallsString = functionCalls.map(f => {
        return f.replace(/(\r\n\t|\n|\r\t)/gm, '')
      }).join('\n  ')

      const content = fileOutput(functionCallsString)

      // Write our translation file.
      const outputPath = compilation.compiler.outputPath
      fs.writeFileSync(path.join(outputPath, output), content);

      // Done!
      callback()
    })
  }
}

/**
 * Extract, based on the range of the expression, the complete string of the
 * function call in the source file.
 * 
 * @param {Expression} expression The parsed expression
 * @param {Parser} parser The webpack parser
 */
function getExpressionInSource (expression, parser) {
  // Find out where the function call is located.
  const start = expression.range[0]
  const end = expression.range[1]

  // Slice out the whole call from the source file.
  const value = parser.state.current._source._value || parser.state.current._source._valueAsString
  if (value && typeof value === 'string') {
    return value.slice(start, end)
  }
}

/**
 * Generate the contents of the file with all function calls for Drupal.
 *
 * @param {String} content All the function calls to Drupal.t and Drupal.formatPlural
 */
function fileOutput (content) {
  return `
// This file is generated by the webpack plugin ${PLUGIN}.
// It is required for Drupal to figure out which translations are needed,
// since its regex is unable to process minified webpack code.

function ${PLUGIN} () {
  ${content}
}
`
}

module.exports = DrupalTranslationsWebpackPlugin
