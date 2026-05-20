/**
 * codeHarness.js
 *
 * Wraps a user's solution function with a language-specific harness that:
 *   1. Reads stdin (one argument per line, array elements space-separated)
 *   2. Parses each line into the declared parameter type
 *   3. Calls the function
 *   4. Serialises the return value to stdout for Judge0 comparison
 *
 * Supported types:
 *   int, long, float, double, string, bool, char
 *   int[], long[], float[], double[], string[], bool[], char[]
 *   int[][], string[][]
 *
 * Usage:
 *   import { buildExecutableCode, generateStarterCode } from '@/lib/codeHarness';
 *   const full = buildExecutableCode(userCode, 'javascript', sig);
 *   const stub = generateStarterCode('python', sig);
 */

// ─── Type helpers ─────────────────────────────────────────────────────────────

function isArray1D(type) { return type.endsWith('[]') && !type.endsWith('[][]'); }
function isArray2D(type) { return type.endsWith('[][]'); }
function baseType(type) { return type.replace(/\[.*/, ''); }

// ─── JavaScript harness ───────────────────────────────────────────────────────

function jsParseExpr(type, lineExpr) {
    const b = baseType(type);
    if (isArray2D(type)) {
        // Each remaining line is a row; handled in the harness template separately
        return `/* 2-D array parsed below */`;
    }
    if (isArray1D(type)) {
        const itemParser = jsScalarParser(b, 'x');
        return `${lineExpr}.split(' ').map(x => ${itemParser})`;
    }
    return jsScalarParser(b, lineExpr);
}

function jsScalarParser(base, expr) {
    switch (base) {
        case 'int':    return `parseInt(${expr})`;
        case 'long':   return `parseInt(${expr})`;
        case 'float':
        case 'double': return `parseFloat(${expr})`;
        case 'bool':   return `(${expr}.trim() === 'true')`;
        case 'char':   return `${expr}.trim()[0]`;
        default:       return `${expr}.trim()`;
    }
}

function jsSerialise(type) {
    if (isArray2D(type)) return `result.map(r => r.join(' ')).join('\\n')`;
    if (isArray1D(type)) return `result.join(' ')`;
    const b = baseType(type);
    if (b === 'bool') return `String(result)`;
    return `String(result)`;
}

function buildJsHarness(userCode, sig) {
    const { name, params, returnType } = sig;

    const lines = [];
    lines.push(userCode);
    lines.push('');
    lines.push('// ── harness ──');
    lines.push(`const _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');`);
    lines.push(`let _li = 0;`);

    const argNames = [];
    for (const p of params) {
        const line = `_lines[_li++]`;
        if (isArray2D(p.type)) {
            // Next line is count, then that many lines are rows
            lines.push(`const _${p.name}_rows = parseInt(_lines[_li++]);`);
            lines.push(`const ${p.name} = [];`);
            lines.push(`for (let _r = 0; _r < _${p.name}_rows; _r++) {`);
            const itemParser = jsScalarParser(baseType(p.type), 'x');
            lines.push(`  ${p.name}.push(_lines[_li++].split(' ').map(x => ${itemParser}));`);
            lines.push(`}`);
        } else {
            const expr = jsParseExpr(p.type, line);
            lines.push(`const ${p.name} = ${expr};`);
        }
        argNames.push(p.name);
    }

    lines.push(`const result = ${name}(${argNames.join(', ')});`);
    lines.push(`console.log(${jsSerialise(returnType)});`);

    return lines.join('\n');
}

// ─── Python harness ───────────────────────────────────────────────────────────

function pyParseExpr(type, lineVar) {
    const b = baseType(type);
    if (isArray2D(type)) return `/* 2-D handled inline */`;
    if (isArray1D(type)) {
        const cast = pyScalarCast(b);
        return cast === '' ? `${lineVar}.split()` : `list(map(${cast}, ${lineVar}.split()))`;
    }
    return pyScalarCast(b) === '' ? lineVar : `${pyScalarCast(b)}(${lineVar})`;
}

function pyScalarCast(base) {
    switch (base) {
        case 'int':
        case 'long':   return 'int';
        case 'float':
        case 'double': return 'float';
        case 'bool':   return ''; // handled inline
        case 'char':   return '';
        default:       return '';
    }
}

function pySerialise(type) {
    if (isArray2D(type)) return `'\\n'.join(' '.join(map(str, r)) for r in result)`;
    if (isArray1D(type)) return `' '.join(map(str, result))`;
    return `str(result).lower() if isinstance(result, bool) else str(result)`;
}

function pyTypehint(type) {
    const b = baseType(type);
    const base = { int: 'int', long: 'int', float: 'float', double: 'float', string: 'str', bool: 'bool', char: 'str' }[b] || 'Any';
    if (isArray2D(type)) return `List[List[${base}]]`;
    if (isArray1D(type)) return `List[${base}]`;
    return base;
}

function buildPyHarness(userCode, sig) {
    const { name, params, returnType } = sig;

    const lines = [];
    lines.push('import sys');
    lines.push('from typing import List, Any');
    lines.push('');
    lines.push(userCode);
    lines.push('');
    lines.push('# ── harness ──');
    lines.push('_data = sys.stdin.read().strip().split(\'\\n\')');
    lines.push('_li = 0');

    const argNames = [];
    for (const p of params) {
        if (isArray2D(p.type)) {
            lines.push(`_${p.name}_rows = int(_data[_li]); _li += 1`);
            const cast = pyScalarCast(baseType(p.type));
            if (cast) {
                lines.push(`${p.name} = [list(map(${cast}, _data[_li + _r].split())) for _r in range(_${p.name}_rows)]; _li += _${p.name}_rows`);
            } else {
                lines.push(`${p.name} = [_data[_li + _r].split() for _r in range(_${p.name}_rows)]; _li += _${p.name}_rows`);
            }
        } else if (p.type === 'bool') {
            lines.push(`${p.name} = _data[_li].strip() == 'true'; _li += 1`);
        } else {
            const expr = pyParseExpr(p.type, `_data[_li]`);
            lines.push(`${p.name} = ${expr}; _li += 1`);
        }
        argNames.push(p.name);
    }

    lines.push(`result = ${name}(${argNames.join(', ')})`);
    lines.push(`print(${pySerialise(returnType)})`);

    return lines.join('\n');
}

// ─── C++ harness ─────────────────────────────────────────────────────────────

function cppType(type) {
    const b = baseType(type);
    const base = {
        int: 'int', long: 'long long', float: 'float', double: 'double',
        string: 'string', bool: 'bool', char: 'char',
    }[b] || 'auto';
    if (isArray2D(type)) return `vector<vector<${base}>>`;
    if (isArray1D(type)) return `vector<${base}>`;
    return base;
}

// All C++ reads use getline throughout so there is no cin/getline newline-skip
// problem when mixing scalar and array params in the same harness.

function cppReadScalar(base, varName) {
    switch (base) {
        case 'string':
            return `string ${varName}; getline(cin, ${varName});`;
        case 'bool':
            return `string _line_${varName}; getline(cin, _line_${varName}); bool ${varName} = (_line_${varName}.find("true") != string::npos);`;
        case 'char':
            return `string _line_${varName}; getline(cin, _line_${varName}); char ${varName} = _line_${varName}.empty() ? '\\0' : _line_${varName}[0];`;
        case 'int':
            return `string _line_${varName}; getline(cin, _line_${varName}); int ${varName} = stoi(_line_${varName});`;
        case 'long':
            return `string _line_${varName}; getline(cin, _line_${varName}); long long ${varName} = stoll(_line_${varName});`;
        case 'float':
            return `string _line_${varName}; getline(cin, _line_${varName}); float ${varName} = stof(_line_${varName});`;
        case 'double':
            return `string _line_${varName}; getline(cin, _line_${varName}); double ${varName} = stod(_line_${varName});`;
        default:
            return `string ${varName}; getline(cin, ${varName});`;
    }
}

// Reads a full line and parses space-separated tokens — no count prefix needed.
function cppReadArray1D(base, varName) {
    const t = cppType(base);
    return [
        `string _line_${varName}; getline(cin, _line_${varName});`,
        `istringstream _iss_${varName}(_line_${varName});`,
        `vector<${t}> ${varName};`,
        `{ ${t} _v; while (_iss_${varName} >> _v) ${varName}.push_back(_v); }`,
    ].join('\n    ');
}

// Row-count line precedes the rows (consistent with JS/Python/Java 2-D format).
function cppReadArray2D(base, varName) {
    const t = cppType(base);
    return [
        `string _rcnt_${varName}; getline(cin, _rcnt_${varName}); int _r_${varName} = stoi(_rcnt_${varName});`,
        `vector<vector<${t}>> ${varName}(_r_${varName});`,
        `for (int _i = 0; _i < _r_${varName}; _i++) {`,
        `    string _row_${varName}; getline(cin, _row_${varName});`,
        `    istringstream _riss_${varName}(_row_${varName});`,
        `    ${t} _rv; while (_riss_${varName} >> _rv) ${varName}[_i].push_back(_rv);`,
        `}`,
    ].join('\n    ');
}

function cppPrintResult(type) {
    if (isArray2D(type)) {
        return [
            `for (int _i = 0; _i < (int)result.size(); _i++) {`,
            `        for (int _j = 0; _j < (int)result[_i].size(); _j++) {`,
            `            if (_j) cout << ' ';`,
            `            cout << result[_i][_j];`,
            `        }`,
            `        cout << '\\n';`,
            `    }`,
        ].join('\n    ');
    }
    if (isArray1D(type)) {
        return [
            `for (int _i = 0; _i < (int)result.size(); _i++) {`,
            `        if (_i) cout << ' ';`,
            `        cout << result[_i];`,
            `    }`,
            `    cout << '\\n';`,
        ].join('\n    ');
    }
    if (baseType(type) === 'bool') return `cout << (result ? "true" : "false") << '\\n';`;
    return `cout << result << '\\n';`;
}

function buildCppHarness(userCode, sig) {
    const { name, params, returnType } = sig;

    const readLines = params.map(p => {
        if (isArray2D(p.type)) return `    ${cppReadArray2D(baseType(p.type), p.name)}`;
        if (isArray1D(p.type)) return `    ${cppReadArray1D(baseType(p.type), p.name)}`;
        return `    ${cppReadScalar(baseType(p.type), p.name)}`;
    });

    const callArgs = params.map(p => p.name).join(', ');
    const retType = cppType(returnType);

    return [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        '',
        userCode,
        '',
        'int main() {',
        '    ios::sync_with_stdio(false);',
        '    cin.tie(nullptr);',
        ...readLines,
        `    ${retType} result = ${name}(${callArgs});`,
        `    ${cppPrintResult(returnType)}`,
        '    return 0;',
        '}',
    ].join('\n');
}

// ─── Java harness ─────────────────────────────────────────────────────────────

function javaType(type) {
    const b = baseType(type);
    const base = {
        int: 'int', long: 'long', float: 'float', double: 'double',
        string: 'String', bool: 'boolean', char: 'char',
    }[b] || 'Object';
    if (isArray2D(type)) return `${base}[][]`;
    if (isArray1D(type)) return `${base}[]`;
    return base;
}

function javaReadParam(p) {
    const b = baseType(p.type);
    const lines = [];
    if (isArray2D(p.type)) {
        lines.push(`int _r_${p.name} = Integer.parseInt(sc.nextLine().trim());`);
        lines.push(`        ${javaType(p.type)} ${p.name} = new ${javaType(b)}[_r_${p.name}][];`);
        lines.push(`        for (int _i = 0; _i < _r_${p.name}; _i++) {`);
        lines.push(`            String[] _row = sc.nextLine().trim().split(" ");`);
        lines.push(`            ${p.name}[_i] = new ${javaType(b)}[_row.length];`);
        lines.push(`            for (int _j = 0; _j < _row.length; _j++) ${p.name}[_i][_j] = ${javaParse(b, '_row[_j]')};`);
        lines.push(`        }`);
    } else if (isArray1D(p.type)) {
        lines.push(`String[] _tok_${p.name} = sc.nextLine().trim().split(" ");`);
        lines.push(`        ${javaType(p.type)} ${p.name} = new ${javaType(b)}[_tok_${p.name}.length];`);
        lines.push(`        for (int _i = 0; _i < _tok_${p.name}.length; _i++) ${p.name}[_i] = ${javaParse(b, `_tok_${p.name}[_i]`)};`);
    } else {
        lines.push(`${javaType(p.type)} ${p.name} = ${javaParse(b, 'sc.nextLine().trim()')};`);
    }
    return lines.join('\n        ');
}

function javaParse(base, expr) {
    switch (base) {
        case 'int':    return `Integer.parseInt(${expr})`;
        case 'long':   return `Long.parseLong(${expr})`;
        case 'float':  return `Float.parseFloat(${expr})`;
        case 'double': return `Double.parseDouble(${expr})`;
        case 'bool':   return `Boolean.parseBoolean(${expr})`;
        case 'char':   return `${expr}.charAt(0)`;
        default:       return expr;
    }
}

function javaPrintResult(type) {
    const b = baseType(type);
    if (isArray2D(type)) {
        return [
            `StringBuilder _sb = new StringBuilder();`,
            `        for (int _i = 0; _i < result.length; _i++) {`,
            `            for (int _j = 0; _j < result[_i].length; _j++) {`,
            `                if (_j > 0) _sb.append(' ');`,
            `                _sb.append(result[_i][_j]);`,
            `            }`,
            `            _sb.append('\\n');`,
            `        }`,
            `        System.out.print(_sb);`,
        ].join('\n        ');
    }
    if (isArray1D(type)) {
        return [
            `StringBuilder _sb = new StringBuilder();`,
            `        for (int _i = 0; _i < result.length; _i++) {`,
            `            if (_i > 0) _sb.append(' ');`,
            `            _sb.append(result[_i]);`,
            `        }`,
            `        System.out.println(_sb);`,
        ].join('\n        ');
    }
    return `System.out.println(result);`;
}

function buildJavaHarness(userCode, sig) {
    const { name, params, returnType } = sig;

    const readBlocks = params.map(p => `        ${javaReadParam(p)}`).join('\n');
    const callArgs = params.map(p => p.name).join(', ');

    return [
        'import java.util.*;',
        'import java.io.*;',
        '',
        userCode,
        '',
        'public class Main {',
        '    public static void main(String[] args) throws Exception {',
        '        Scanner sc = new Scanner(new BufferedReader(new InputStreamReader(System.in)));',
        readBlocks,
        `        Solution sol = new Solution();`,
        `        ${javaType(returnType)} result = sol.${name}(${callArgs});`,
        `        ${javaPrintResult(returnType)}`,
        '    }',
        '}',
    ].join('\n');
}

// ─── Input format (all languages) ────────────────────────────────────────────
//
// 1-D arrays: one line of space-separated values, no count prefix.
// 2-D arrays: one row-count line, then that many lines of space-separated values.
// Scalars:    one line containing the value.
//
// Example — twoSum(nums: int[], target: int):
//   2 7 11 15
//   9
//
// Example — matrixQuery(matrix: int[][], k: int):
//   3          ← row count
//   1 2 3
//   4 5 6
//   7 8 9
//   5          ← k

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Wraps user code with a language-specific harness.
 * If sig is null/undefined the user code is returned unchanged (raw stdin mode).
 *
 * @param {string} userCode
 * @param {'javascript'|'python'|'cpp'|'java'} language
 * @param {{ name: string, params: {name:string,type:string}[], returnType: string }|null} sig
 * @returns {string}
 */
export function buildExecutableCode(userCode, language, sig) {
    if (!sig || !sig.name || !sig.params?.length) return userCode;
    switch (language) {
        case 'javascript': return buildJsHarness(userCode, sig);
        case 'python':     return buildPyHarness(userCode, sig);
        case 'cpp':        return buildCppHarness(userCode, sig);
        case 'java':       return buildJavaHarness(userCode, sig);
        default:           return userCode;
    }
}

/**
 * Generates a language-appropriate function stub for the editor.
 *
 * @param {'javascript'|'python'|'cpp'|'java'} language
 * @param {{ name: string, params: {name:string,type:string}[], returnType: string }} sig
 * @returns {string}
 */
export function generateStarterCode(language, sig) {
    if (!sig?.name) return '';
    const { name, params, returnType } = sig;

    switch (language) {
        case 'javascript': {
            const jsdocParams = params.map(p => ` * @param {${jsDocType(p.type)}} ${p.name}`).join('\n');
            const paramList = params.map(p => p.name).join(', ');
            return [
                `/**`,
                jsdocParams,
                ` * @return {${jsDocType(returnType)}}`,
                ` */`,
                `function ${name}(${paramList}) {`,
                `    `,
                `}`,
            ].join('\n');
        }
        case 'python': {
            const typedParams = params.map(p => `${p.name}: ${pyTypehint(p.type)}`).join(', ');
            const retHint = pyTypehint(returnType);
            const imports = needsPyImport(params, returnType) ? 'from typing import List, Any\n\n' : '';
            return `${imports}def ${name}(${typedParams}) -> ${retHint}:\n    `;
        }
        case 'cpp': {
            const paramList = params.map(p => `${cppType(p.type)}${isArray1D(p.type) || isArray2D(p.type) ? '&' : ''} ${p.name}`).join(', ');
            return [
                `#include <bits/stdc++.h>`,
                `using namespace std;`,
                ``,
                `${cppType(returnType)} ${name}(${paramList}) {`,
                `    `,
                `}`,
            ].join('\n');
        }
        case 'java': {
            const paramList = params.map(p => `${javaType(p.type)} ${p.name}`).join(', ');
            return [
                `import java.util.*;`,
                ``,
                `class Solution {`,
                `    public ${javaType(returnType)} ${name}(${paramList}) {`,
                `        `,
                `    }`,
                `}`,
            ].join('\n');
        }
        default: return '';
    }
}

// ─── Internal helpers for starter code ───────────────────────────────────────

function jsDocType(type) {
    const b = baseType(type);
    const base = { int: 'number', long: 'number', float: 'number', double: 'number', string: 'string', bool: 'boolean', char: 'string' }[b] || 'any';
    if (isArray2D(type)) return `${base}[][]`;
    if (isArray1D(type)) return `${base}[]`;
    return base;
}

function needsPyImport(params, returnType) {
    const all = [...params.map(p => p.type), returnType];
    return all.some(t => isArray1D(t) || isArray2D(t));
}
