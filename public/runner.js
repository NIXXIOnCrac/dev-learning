/* This runtime never sends student code to the application server for execution.
   CSP restricts requests to runtime asset paths; workers cannot access the DOM.
   The UI terminates each worker at a fixed deadline. Browser memory is not a
   hard quota: use a hardened external executor before public competitive use. */
let output = [];
let captureOutput = true;
function emit(...args) {
  if (captureOutput && output.length < 500)
    output.push(
      args
        .map((x) => {
          try {
            return typeof x === "object" ? JSON.stringify(x) : String(x);
          } catch {
            return "[Unserializable value]";
          }
        })
        .join(" ")
        .slice(0, 4000),
    );
}
function checkJavaScriptSource(source, check) {
  const tree = ts.createSourceFile(
    "student.js",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const all = [];
  const visit = (node) => {
    all.push(node);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  if (check === "loop")
    return all.some(
      (n) =>
        ts.isForOfStatement(n) ||
        ts.isForStatement(n) ||
        ts.isWhileStatement(n) ||
        ts.isDoStatement(n),
    );
  if (check === "arithmetic-total") {
    const assignment = all.find(
      (n) =>
        ts.isVariableDeclaration(n) &&
        ts.isIdentifier(n.name) &&
        n.name.text === "total" &&
        n.initializer,
    );
    if (!assignment) return false;
    const parts = [];
    const scan = (n) => {
      parts.push(n);
      ts.forEachChild(n, scan);
    };
    scan(assignment.initializer);
    return (
      ["price", "quantity", "discount"].every((name) =>
        parts.some((n) => ts.isIdentifier(n) && n.text === name),
      ) &&
      [ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.MinusToken].every((kind) =>
        parts.some(
          (n) => ts.isBinaryExpression(n) && n.operatorToken.kind === kind,
        ),
      )
    );
  }
  return false;
}
self.onmessage = async ({ data }) => {
  const {
    code,
    language,
    tests = [],
    files = {},
    trace: shouldTrace = false,
  } = data;
  let trace = [];
  let traceTruncated = false;
  const started = performance.now();
  output = [];
  captureOutput = true;
  try {
    let evaluate;
    if (language === "python") {
      importScripts("/runtime/pyodide/pyodide.js");
      const py = await loadPyodide({ indexURL: "/runtime/pyodide/" });
      self.postMessage({ type: "ready" });
      py.setStdout({ batched: emit });
      py.setStderr({ batched: emit });
      for (const [name, body] of Object.entries(files)) {
        if (/^[a-zA-Z0-9_-]+\.py$/.test(name))
          py.FS.writeFile("/home/pyodide/" + name, body);
      }
      py.runPython('import os\nos.chdir("/home/pyodide")');
      const runStart = performance.now();
      if (shouldTrace) {
        py.globals.set("__forge_source__", code);
        py.runPython(`
import sys as _forge_sys
import json as _forge_json
import reprlib as _forge_reprlib
_forge_steps = []
_forge_truncated = False
_forge_repr = _forge_reprlib.Repr()
_forge_repr.maxstring = 100
_forge_repr.maxlist = 6
_forge_repr.maxdict = 6
_forge_repr.maxlevel = 2

def _forge_trace(frame, event, arg):
    global _forge_truncated
    if frame.f_code.co_filename != "student.py":
        return None
    if event not in ("line", "return"):
        return _forge_trace
    if len(_forge_steps) >= 160:
        _forge_truncated = True
        return None
    snapshot = {}
    for name, value in list(frame.f_locals.items()):
        if name.startswith("_") or len(snapshot) >= 20:
            continue
        if type(value) in (str, int, float, bool, list, dict, tuple, set, type(None)):
            snapshot[name] = _forge_repr.repr(value)[:180]
    _forge_steps.append({"line": frame.f_lineno, "event": event,
        "function": frame.f_code.co_name, "variables": snapshot,
        "returnValue": _forge_repr.repr(arg)[:180] if event == "return" else None})
    return _forge_trace
_forge_sys.settrace(_forge_trace)
`);
      }
      try {
        await py.runPythonAsync(
          shouldTrace
            ? 'exec(compile(__forge_source__, "student.py", "exec"), globals())'
            : code,
          { filename: shouldTrace ? "<forge-trace-driver>" : "student.py" },
        );
      } finally {
        if (shouldTrace) {
          // Disable tracing before serializing or executing any assessment tests.
          py.runPython("_forge_sys.settrace(None)");
          trace = JSON.parse(py.runPython("_forge_json.dumps(_forge_steps)"));
          traceTruncated = Boolean(py.runPython("_forge_truncated"));
        }
      }
      py.globals.set("__forge_source__", code);
      evaluate = async (expression) =>
        Boolean(await py.runPythonAsync(expression));
      var runtime = performance.now() - runStart;
    } else if (language === "javascript" || language === "typescript") {
      let source = code;
      if (language === "typescript" || tests.some((t) => t.sourceCheck)) {
        importScripts("/runtime/ts/typescript.js");
      }
      if (language === "typescript") {
        source = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.None,
          },
        }).outputText;
      }
      self.postMessage({ type: "ready" });
      const expressionTests = tests.filter((t) => t.expression);
      const runStart = performance.now();
      // Async callbacks preserve the learner's lexical scope and isolate each
      // assertion. A thrown assertion must not mark every other test as failed.
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const checks = await new AsyncFunction(
        "console",
        '"use strict";\n' +
          source +
          "\n;return [" +
          expressionTests
            .map((t) => "async () => Boolean(await (" + t.expression + "))")
            .join(",") +
          "];\n//# sourceURL=student.js",
      )({ log: emit, warn: emit, error: emit });
      let index = 0;
      evaluate = async () => await checks[index++]();
      runtime = performance.now() - runStart;
    } else if (language === "sql") {
      importScripts("/runtime/sql/sql-wasm.js");
      const SQL = await initSqlJs({ locateFile: (f) => "/runtime/sql/" + f });
      const db = new SQL.Database();
      self.postMessage({ type: "ready" });
      const runStart = performance.now();
      const results = db.exec(code);
      for (const table of results) {
        emit(table.columns.join(" | "));
        for (const row of table.values) emit(row.join(" | "));
      }
      db.close();
      runtime = performance.now() - runStart;
    } else
      throw new Error(
        "This language is not supported in the console. Use the live website preview for HTML and CSS.",
      );
    captureOutput = false; // Test invocations are not part of the learner’s console output.
    const results = [];
    let outputIndex = 0;
    for (const test of tests) {
      let passed = false;
      let actual;
      try {
        if (test.sourceCheck)
          passed = checkJavaScriptSource(code, test.sourceCheck);
        else if (test.expression) passed = await evaluate(test.expression);
        else {
          actual = output[outputIndex++] ?? "";
          passed = actual === test.expected;
          if (
            outputIndex ===
              tests.filter((t) => t.expected !== undefined).length &&
            output.length !== outputIndex
          )
            passed = false;
        }
      } catch (e) {
        actual = e.message;
      }
      results.push({
        label: test.label,
        hidden: !!test.hidden,
        passed,
        expected: test.hidden ? undefined : test.expected,
        actual: test.hidden ? undefined : actual,
      });
    }
    self.postMessage({
      type: "result",
      language,
      trace,
      traceTruncated,
      output,
      tests: results,
      runtime: Math.round(runtime * 100) / 100,
      total: Math.round(performance.now() - started),
    });
  } catch (e) {
    self.postMessage({
      type: "result",
      language,
      trace,
      traceTruncated,
      output,
      error: String(
        language === "python"
          ? e.message || e
          : e.stack || `${e.name || "Error"}: ${e.message || e}`,
      ).slice(-6000),
      tests: tests.map((t) => ({
        label: t.label,
        hidden: !!t.hidden,
        passed: false,
      })),
      runtime: Math.round(performance.now() - started),
    });
  }
};
