import React, { useCallback, useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { api, Icon, Pill, Modal } from "./ui.jsx";
import { courseForLesson } from "./content.js";
import TraceViewer, { ErrorGuide } from "./TraceViewer.jsx";
self.MonacoEnvironment = {
  getWorker(_, label) {
    return label === "json"
      ? new JsonWorker()
      : ["css", "scss", "less"].includes(label)
        ? new CssWorker()
        : label === "html"
          ? new HtmlWorker()
          : ["typescript", "javascript"].includes(label)
            ? new TsWorker()
            : new EditorWorker();
  },
};
monaco.languages.registerCompletionItemProvider("python", {
  provideCompletionItems(model, position) {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };
    return {
      suggestions: [
        ["print", "Display a value", "print(${1:value})"],
        [
          "def",
          "Define a reusable function",
          "def ${1:name}(${2:parameter}):\n    ${3:pass}",
        ],
        [
          "if",
          "Run code when a condition is true",
          "if ${1:condition}:\n    ${2:pass}",
        ],
        [
          "for",
          "Repeat for each item",
          "for ${1:item} in ${2:items}:\n    ${3:pass}",
        ],
        ["return", "Return a value to the caller", "return ${1:value}"],
      ].map(([label, detail, insertText]) => ({
        label,
        detail,
        insertText,
        range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      })),
    };
  },
});

monaco.editor.defineTheme("forge", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "63728c", fontStyle: "italic" },
    { token: "string", foreground: "A1D6A5" },
    { token: "keyword", foreground: "BB9AF7" },
    { token: "number", foreground: "F0BB80" },
  ],
  colors: {
    "editor.background": "#0c1018",
    "editorLineNumber.foreground": "#3f4b60",
    "editorLineNumber.activeForeground": "#a0adc2",
    "editor.selectionBackground": "#234371",
    "editor.lineHighlightBackground": "#121a27",
    "editorCursor.foreground": "#77a9ff",
    "editorIndentGuide.background1": "#1d2738",
  },
});
// Own the editor lifecycle directly: the bundled Monaco instance is already
// available when this lazy-loaded module resolves. No CDN/async loader race.
export function CodeEditor({
  value,
  onChange,
  language = "python",
  exam = false,
  onMount,
}) {
  const host = useRef(null);
  const control = useRef(null);
  const latestProps = useRef({ value, onChange, language, exam, onMount });
  latestProps.current = { value, onChange, language, exam, onMount };
  const examOptions = (independent) => ({
    quickSuggestions: !independent,
    suggestOnTriggerCharacters: !independent,
    wordBasedSuggestions: independent ? "off" : "currentDocument",
    parameterHints: { enabled: !independent },
    inlineSuggest: { enabled: !independent },
    acceptSuggestionOnEnter: independent ? "off" : "on",
    tabCompletion: "off",
    suggest: {
      showMethods: !independent,
      showFields: !independent,
      showClasses: !independent,
      showStructs: !independent,
      showInterfaces: !independent,
      showModules: !independent,
      showProperties: !independent,
      showEvents: !independent,
      showOperators: !independent,
      showUnits: !independent,
      showValues: !independent,
      showConstants: !independent,
      showEnums: !independent,
      showEnumMembers: !independent,
      showColors: !independent,
      showFiles: !independent,
      showReferences: !independent,
      showFolders: !independent,
      showTypeParameters: !independent,
      showIssues: !independent,
      showUsers: !independent,
      showSnippets: !independent,
      showWords: !independent,
      showFunctions: !independent,
      showKeywords: !independent,
      showVariables: !independent,
    },
  });
  useEffect(() => {
    const current = latestProps.current;
    const model = monaco.editor.createModel(current.value, current.language);
    const ed = monaco.editor.create(host.current, {
      model,
      theme: "forge",
      fontSize: 14,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 22 },
      lineNumbersMinChars: 4,
      tabSize: current.language === "python" ? 4 : 2,
      automaticLayout: true,
      wordWrap: "on",
      renderLineHighlight: "all",
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      ...examOptions(current.exam),
    });
    control.current = ed;
    const change = ed.onDidChangeModelContent(() =>
      latestProps.current.onChange(ed.getValue()),
    );
    current.onMount?.(ed);
    return () => {
      change.dispose();
      ed.dispose();
      model.dispose();
      control.current = null;
    };
  }, []);
  useEffect(() => {
    const ed = control.current;
    if (ed && ed.getValue() !== value) ed.setValue(value);
  }, [value]);
  useEffect(() => {
    const model = control.current?.getModel();
    if (model && model.getLanguageId() !== language)
      monaco.editor.setModelLanguage(model, language);
  }, [language]);
  useEffect(() => {
    control.current?.updateOptions(examOptions(exam));
  }, [exam]);
  return (
    <div
      ref={host}
      className="monaco-host"
      style={{ height: "100%", width: "100%", minWidth: 0 }}
    />
  );
}
export function useRunner() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState(null);
  const active = useRef(null);
  useEffect(
    () => () => {
      active.current?.worker.terminate();
      clearTimeout(active.current?.timer);
    },
    [],
  );
  function run(code, language, tests = [], files = {}, options = {}) {
    setRunning(true);
    setResult(null);
    setPhase("Preparing isolated runtime…");
    return new Promise((resolve) => {
      const worker = new Worker("/runner.js");
      const finish = (r) => {
        r.language = language;
        worker.terminate();
        clearTimeout(active.current?.timer);
        active.current = null;
        setRunning(false);
        setResult(r);
        resolve(r);
      };
      const timeout = () =>
        finish({
          error:
            "Execution stopped: time limit exceeded. Check for a loop that never ends. Your editor and saved code are safe.",
          output: [],
          tests: tests.map((t) => ({ ...t, passed: false })),
          runtime: 5000,
        });
      active.current = { worker, timer: setTimeout(timeout, 45000) };
      worker.onmessage = ({ data }) => {
        if (data.type === "ready") {
          clearTimeout(active.current.timer);
          active.current.timer = setTimeout(timeout, 5000);
          setPhase("Running your code…");
        } else finish(data);
      };
      worker.onerror = (e) =>
        finish({
          error: e.message || "The runtime could not start. Please try again.",
          output: [],
          tests: tests.map((t) => ({ ...t, passed: false })),
          runtime: 0,
        });
      worker.postMessage({
        code,
        language,
        tests,
        files,
        trace: !!options.trace,
      });
    });
  }
  return { run, running, result, setResult, phase };
}
export function ConsoleOutput({
  result,
  running,
  phase,
  tab,
  setTab,
  history = [],
  onRestore,
  tracePanel,
}) {
  return (
    <div className="console">
      <div className="console-tabs">
        {["Console", "Tests", "History", ...(tracePanel ? ["Trace"] : [])].map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <Icon
                name={
                  t === "Console"
                    ? "terminal"
                    : t === "Tests"
                      ? "tests"
                      : t === "Trace"
                        ? "bug"
                        : "history"
                }
                size={14}
              />
              {t}
              {t === "Tests" && result?.tests?.length > 0 && (
                <span
                  className={
                    result.tests.every((t) => t.passed)
                      ? "test-count pass"
                      : "test-count"
                  }
                >
                  {result.tests.filter((t) => t.passed).length}/
                  {result.tests.length}
                </span>
              )}
            </button>
          ),
        )}
        {result && (
          <span className="runtime">{result.runtime} ms · browser runtime</span>
        )}
      </div>
      <div className="console-body" role="status">
        {!running && tab === "Tests" && result?.error && (
          <>
            <ErrorGuide error={result.error} language={result.language} />
            <details className="runtime-error-trace">
              <summary>Original execution error</summary>
              <pre className="error-output">{result.error}</pre>
            </details>
          </>
        )}
        {running ? (
          <div className="console-placeholder">
            <Icon name="loading" className="spin" />
            {phase}
          </div>
        ) : tab === "Trace" ? (
          tracePanel
        ) : tab === "History" ? (
          history.length ? (
            history.map((h, i) => (
              <div className="history-row" key={i}>
                <Icon name={h.passed ? "success" : "alert"} />
                <span>
                  {new Date(h.created).toLocaleString()}
                  <small>
                    {h.runtime} ms · {h.passed ? "Passed" : "Keep practicing"}
                  </small>
                </span>
                <button onClick={() => onRestore(h.code)}>Restore</button>
              </div>
            ))
          ) : (
            <div className="console-placeholder">
              Your submitted attempts will appear here.
            </div>
          )
        ) : tab === "Tests" ? (
          result?.tests?.length ? (
            result.tests.map((test, i) => (
              <div
                className={`test-result ${test.passed ? "pass" : "fail"}`}
                key={i}
              >
                <Icon name={test.passed ? "success" : "x"} size={16} />
                <div>
                  <span>
                    {test.hidden ? "Additional edge case" : test.label}
                  </span>
                  {test.hidden && <Pill>HIDDEN</Pill>}
                  {!test.passed &&
                    !test.hidden &&
                    test.expected === undefined &&
                    test.actual && (
                      <small>
                        {String(test.actual).split("\n").slice(-2).join(" ")}
                      </small>
                    )}
                  {!test.passed && test.expected !== undefined && (
                    <small>
                      Expected: {JSON.stringify(test.expected)} · Received:{" "}
                      {JSON.stringify(test.actual)}
                    </small>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="console-placeholder">
              Run your code to see the test results.
            </div>
          )
        ) : result ? (
          <>
            <div className="output-label">
              ${" "}
              {result.error
                ? "Program finished with an error"
                : "Program finished"}
            </div>
            {result.output?.map((line, i) => (
              <pre key={i}>{line}</pre>
            ))}
            {result.error && (
              <>
                <ErrorGuide error={result.error} language={result.language} />
                <pre className="error-output">{result.error}</pre>
              </>
            )}
            {!result.error && !result.output?.length && (
              <span className="muted">
                No console output. Use print() or console.log() to display a
                value.
              </span>
            )}
          </>
        ) : (
          <div className="console-placeholder">
            <Icon name="terminal" size={23} />
            <div>
              Your ideas start here.
              <small>Run your code to see what happens.</small>
            </div>
            <kbd>Ctrl ↵</kbd>
          </div>
        )}
      </div>
    </div>
  );
}
export default function Workspace({
  lesson,
  state,
  setState,
  mode,
  setMode,
  onBack,
  onNext,
  onTutor,
  onCodeChange,
  notify,
}) {
  const course = courseForLesson(lesson);
  const languageName = lesson.language === "python" ? "Python" : "JavaScript";
  const blankStarter =
    (lesson.language === "python" ? "#" : "//") +
    " Write your solution from memory.\n";
  const brokenStarter =
    lesson.debugStarter ||
    lesson.solution.replace("print(", "prnt(").replace("return ", "retrun ");
  const [code, setCode] = useState(
    mode === "exam"
      ? blankStarter
      : mode === "debug"
        ? brokenStarter
        : (state.drafts[lesson.id] ?? lesson.starter),
  );
  useEffect(() => {
    onCodeChange?.(code);
  }, [code, onCodeChange]);
  const [tab, setTab] = useState(mode === "learn" ? "Lesson" : "Exercise");
  const [consoleTab, setConsoleTab] = useState("Console");
  const [history, setHistory] = useState([]);
  const [hint, setHint] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saved, setSaved] = useState(true);
  const [reset, setReset] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const { run, running, result, phase, setResult } = useRunner();
  const editor = useRef();
  const traceDecorations = useRef();
  const [traceCode, setTraceCode] = useState(null);
  const highlightStep = useCallback((step) => {
    if (!editor.current?.getModel()) return;
    traceDecorations.current?.clear();
    if (step) {
      traceDecorations.current = editor.current.createDecorationsCollection([
        {
          range: new monaco.Range(step.line, 1, step.line, 1),
          options: {
            isWholeLine: true,
            className: "trace-line-highlight",
            linesDecorationsClassName: "trace-line-marker",
          },
        },
      ]);
      editor.current.revealLineInCenterIfOutsideViewport(step.line);
    }
  }, []);
  async function traceCodeRun() {
    if (running) return;
    setTraceCode(code);
    setConsoleTab("Trace");
    await run(code, "python", [], {}, { trace: true });
  }
  const latest = useRef();
  const start = useRef(Date.now());
  const timeRecordedAt = useRef(Date.now());
  const initial = useRef(true);
  const pendingDraft = useRef({ id: lesson.id, code });
  pendingDraft.current = { id: lesson.id, code };
  useEffect(() => {
    const flush = () =>
      fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: pendingDraft.current }),
        keepalive: true,
      }).catch(() => {});
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  const unlocked = state.completed.includes(lesson.id);
  const challenge = !!lesson.difficulty;
  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - start.current) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    api("history")
      .then((h) => setHistory(h.filter((x) => x.lesson === lesson.id)))
      .catch(() => {});
  }, [lesson.id]);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(
      () =>
        api("state", { draft: { id: lesson.id, code } }, "PATCH")
          .then((s) => {
            setState((prev) => ({ ...prev, drafts: s.drafts }));
            setSaved(true);
          })
          .catch((e) => notify(e.message, "error")),
      750,
    );
    return () => clearTimeout(t);
  }, [code]);
  async function execute(submit = false) {
    if (running) return;
    setConsoleTab(submit ? "Tests" : "Console");
    const r = await run(code, lesson.language, lesson.tests);
    if (r.error) {
      const match =
        lesson.language === "python"
          ? r.error.match(/line (\d+)/)
          : r.error.match(/student\.js:(\d+)/);
      if (match && editor.current) {
        const line =
          lesson.language === "python"
            ? Number(match[1])
            : Math.max(1, Number(match[1]) - 3);
        monaco.editor.setModelMarkers(editor.current.getModel(), "execution", [
          {
            severity: monaco.MarkerSeverity.Error,
            message:
              lesson.language === "python"
                ? r.error.split("\n").pop()
                : r.error.split("\n")[0],
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 200,
          },
        ]);
      }
    } else if (editor.current)
      monaco.editor.setModelMarkers(editor.current.getModel(), "execution", []);
    if (submit) {
      try {
        const response = await api("submissions", {
          lesson: lesson.id,
          code,
          tests: r.tests,
          error: r.error,
          runtime: r.runtime,
          mode,
          time: Math.floor((Date.now() - timeRecordedAt.current) / 1000),
        });
        timeRecordedAt.current = Date.now();
        setState(response.state);
        setHistory((h) => [
          {
            code,
            passed: response.passed,
            runtime: r.runtime,
            created: new Date().toISOString(),
          },
          ...h,
        ]);
        if (response.passed) {
          setSuccess(response);
          if (state.settings.sound) {
            try {
              const ctx = new AudioContext();
              const oscillator = ctx.createOscillator();
              const gain = ctx.createGain();
              oscillator.connect(gain);
              gain.connect(ctx.destination);
              oscillator.frequency.setValueAtTime(520, ctx.currentTime);
              oscillator.frequency.setValueAtTime(780, ctx.currentTime + 0.12);
              gain.gain.setValueAtTime(0.06, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.4,
              );
              oscillator.start();
              oscillator.stop(ctx.currentTime + 0.4);
              oscillator.onended = () => ctx.close();
            } catch {}
          }
        } else
          notify(
            "Not quite yet. Check the tests, then try one small change.",
            "info",
          );
      } catch (e) {
        notify(e.message, "error");
      }
    }
  }
  latest.current = execute;
  async function showHint() {
    setHint((h) => Math.min(h + 1, lesson.hints.length));
    try {
      const s = await api("state", { hint: lesson.id }, "PATCH");
      setState((prev) => ({ ...prev, hints: s.hints }));
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <div className="workspace-page">
      <div className="workspace-breadcrumb">
        <button onClick={onBack}>
          <Icon name="back" size={16} />{" "}
          {challenge ? "Challenges" : course.name}
        </button>
        <span>/</span>
        <span>{lesson.title}</span>
        <div className="workspace-top-right">
          {mode === "exam" ? (
            <Pill color="purple">
              <Icon name="exam" size={13} /> Independent assessment
            </Pill>
          ) : (
            <>
              <span className="tiny muted">LEARNING MODE</span>
              <select
                aria-label="Learning mode"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  if (e.target.value === "debug") {
                    setCode(brokenStarter);
                    setTab("Exercise");
                  }
                  if (e.target.value === "exam") {
                    setCode(blankStarter);
                    setTab("Exercise");
                    setHint(0);
                    setReveal(false);
                  }
                  if (e.target.value === "practice") setTab("Exercise");
                }}
              >
                <option value="learn">Learn</option>
                <option value="practice">Practice</option>
                <option value="debug">Debug</option>
                <option value="exam">Exam</option>
              </select>
            </>
          )}
          <span className="time-display">
            <Icon name="clock" size={14} />
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="workspace-split">
        <section className="lesson-pane">
          <div className="lesson-tabs">
            {(mode === "exam"
              ? ["Exercise"]
              : ["Lesson", "Exercise", "Hints"]
            ).map((t) => (
              <button
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Hints" && <Icon name="lightbulb" size={14} />}
              </button>
            ))}
          </div>
          <div className="lesson-body">
            <div className="lesson-eyebrow">
              {challenge
                ? `${lesson.boss ? "BOSS BATTLE · " : ""}${lesson.difficulty} CHALLENGE`
                : `CHAPTER ${String(course.chapter).padStart(2, "0")} · LESSON ${course.lessons.findIndex((l) => l.id === lesson.id) + 1} OF ${course.lessons.length}`}
            </div>
            <h1>{lesson.title}</h1>
            <div className="lesson-meta">
              <span>
                <Icon name="clock" size={14} />
                {lesson.duration} min
              </span>
              <span className="xp">
                <Icon name="zap" size={14} />
                {lesson.xp} XP
              </span>
              <span>{languageName}</span>
              {unlocked && (
                <span className="mint-text">
                  <Icon name="check" size={14} />
                  Completed
                </span>
              )}
            </div>
            {tab === "Lesson" && mode !== "exam" ? (
              <>
                <p className="lesson-lead">{lesson.description}</p>
                <h3>Let’s break it down</h3>
                <p>{lesson.paragraph}</p>
                <div className="code-example">
                  <div>
                    <span>{lesson.file}</span>
                    <button
                      className="text-button"
                      onClick={() => {
                        setCode(lesson.example);
                        notify(
                          "Example loaded. Change something, then run it.",
                        );
                      }}
                    >
                      Try this example <Icon name="play" size={12} />
                    </button>
                  </div>
                  <pre>{lesson.example}</pre>
                </div>
                <h3>Every symbol has a job.</h3>
                <div className="symbol-list">
                  {lesson.symbols.map(([syntax, explanation]) => (
                    <div key={syntax}>
                      <code>{syntax}</code>
                      <p>{explanation}</p>
                    </div>
                  ))}
                </div>
                <div className="prediction">
                  <span className="eyebrow">
                    <Icon name="eye" size={15} /> READ BEFORE YOU RUN
                  </span>
                  <h3>What will this code display?</h3>
                  <pre>{lesson.predict.code}</pre>
                  <div className="prediction-options">
                    {lesson.predict.options.map((o) => (
                      <button
                        className={
                          prediction === o
                            ? o === lesson.predict.answer
                              ? "correct"
                              : "incorrect"
                            : ""
                        }
                        key={o}
                        onClick={() => setPrediction(o)}
                      >
                        <pre>{o}</pre>
                        {prediction === o && (
                          <Icon
                            name={o === lesson.predict.answer ? "check" : "x"}
                            size={15}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  {prediction && (
                    <p
                      className={
                        prediction === lesson.predict.answer
                          ? "mint-text"
                          : "orange-text"
                      }
                    >
                      {prediction === lesson.predict.answer
                        ? "Exactly. You’re learning to read code."
                        : "Trace it one line at a time. What happens first?"}
                    </p>
                  )}
                </div>
                <button
                  className="button primary full"
                  onClick={() => setTab("Exercise")}
                >
                  Your turn to write code <Icon name="arrow" size={16} />
                </button>
              </>
            ) : tab === "Hints" && mode !== "exam" ? (
              <>
                <p className="lesson-lead">A nudge, not the answer.</p>
                <p>
                  Try one hint at a time, then go back to your code. Getting
                  unstuck is part of learning.
                </p>
                {lesson.hints.slice(0, hint).map((h, i) => (
                  <div className="hint-card" key={h}>
                    <span>
                      HINT {i + 1} ·{" "}
                      {
                        [
                          "A little direction",
                          "Where to look",
                          "The strategy",
                          "Pseudocode",
                        ][i]
                      }
                    </span>
                    <p>{h}</p>
                  </div>
                ))}
                {hint < lesson.hints.length && (
                  <button className="button secondary full" onClick={showHint}>
                    <Icon name="lightbulb" size={16} />
                    {hint ? "Give me another nudge" : "Show the first hint"}
                  </button>
                )}
                <details
                  className="solution-details"
                  onToggle={(e) => setReveal(e.currentTarget.open)}
                >
                  <summary>Explicitly reveal the worked solution</summary>
                  <p>
                    Read it, close it, and try writing it from memory. Viewing a
                    solution does not earn XP.
                  </p>
                  {reveal && <pre>{lesson.solution}</pre>}
                  <p>{lesson.explain}</p>
                </details>
              </>
            ) : (
              <>
                <p className="lesson-lead">
                  {mode === "debug"
                    ? "A tiny bug, a useful lesson. Read the symptoms, trace the code, and fix the behavior."
                    : mode === "exam"
                      ? "Write this from memory. Hints, the tutor, and autocomplete are switched off. This is an untimed assessment."
                      : "Put your new knowledge to work."}
                </p>
                <div className="task-box">
                  <span className="eyebrow">
                    <Icon name="target" size={16} /> YOUR MISSION
                  </span>
                  <p>
                    {mode === "debug" && lesson.debugTask
                      ? lesson.debugTask
                      : lesson.task}
                  </p>
                </div>
                {lesson.examples && (
                  <>
                    <h3>Examples</h3>
                    {lesson.examples.map(([input, output]) => (
                      <div className="example-io" key={input}>
                        <span>
                          Input <code>{input}</code>
                        </span>
                        <span>
                          Output <code>{output}</code>
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {lesson.constraints && (
                  <>
                    <h3>Constraints</h3>
                    <ul>
                      {lesson.constraints.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}
                <h3>What we’re checking</h3>
                <div className="visible-tests">
                  {lesson.tests.map((t, i) => (
                    <div key={i}>
                      <Icon name={t.hidden ? "lock" : "circle"} size={15} />
                      <span>
                        {t.hidden ? "An additional edge case" : t.label}
                      </span>
                      {t.expected && <code>{JSON.stringify(t.expected)}</code>}
                    </div>
                  ))}
                </div>
                <div className="info-note">
                  <Icon name="lightbulb" size={18} />
                  <p>
                    <strong>Make it yours.</strong> Run your code as often as
                    you like. When you’re happy with it, submit to check your
                    understanding and earn XP.
                  </p>
                </div>
                {unlocked && mode !== "exam" && (
                  <div className="hint-card">
                    <span>WHY IT WORKS</span>
                    <p>{lesson.explain}</p>
                    {lesson.complexity && <p>{lesson.complexity}</p>}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="lesson-footer">
            <Icon name="shield" size={15} />
            <span>Real understanding. One small step at a time.</span>
          </div>
        </section>
        <section className="editor-pane">
          <div className="editor-toolbar">
            <div className="file-tab">
              <Icon name="file" size={15} />
              {lesson.file}
              <span className="blue-dot" />
            </div>
            <div>
              <span className="saved-indicator">
                <Icon name={saved ? "check" : "loading"} size={13} />
                {saved ? "Saved" : "Saving…"}
              </span>
              <button
                title="Reset code"
                aria-label="Reset code"
                className="icon-button"
                onClick={() => setReset(true)}
              >
                <Icon name="reset" size={15} />
              </button>
            </div>
          </div>
          <div className="editor-container">
            <CodeEditor
              value={code}
              language={lesson.language}
              onChange={setCode}
              exam={mode === "exam"}
              onMount={(ed) => {
                editor.current = ed;
                ed.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                  () => latest.current(false),
                );
              }}
            />
          </div>
          <div className="editor-status">
            <span>
              <span className="green-dot" />
              {lesson.language === "python"
                ? "Python 3 · WebAssembly"
                : "JavaScript · Browser worker"}
            </span>
            <span>
              UTF-8 <span>Spaces: {lesson.language === "python" ? 4 : 2}</span>
            </span>
          </div>
          <ConsoleOutput
            result={result}
            running={running}
            phase={phase}
            tab={consoleTab}
            setTab={setConsoleTab}
            history={mode === "exam" ? [] : history}
            tracePanel={
              mode !== "exam" && lesson.language === "python" ? (
                <TraceViewer
                  result={result}
                  stale={traceCode !== null && traceCode !== code}
                  onStep={highlightStep}
                />
              ) : null
            }
            onRestore={(c) => {
              setCode(c);
              notify("Attempt restored to your editor.");
            }}
          />
          {mode !== "exam" && lesson.language === "python" && (
            <div className="trace-launch">
              <button
                className="text-button"
                disabled={running}
                onClick={traceCodeRun}
              >
                <Icon name="bug" size={14} />
                Trace code
              </button>
              <span>See each step and its variables. No guessing.</span>
            </div>
          )}
          <div className="run-bar">
            <button
              className="button secondary"
              disabled={running}
              onClick={() => execute(false)}
            >
              <Icon
                name={running ? "loading" : "play"}
                className={running ? "spin" : ""}
                size={16}
              />
              {running ? "Running…" : "Run code"}
              <kbd>⌘ ↵</kbd>
            </button>
            <button
              className="button primary"
              disabled={running}
              onClick={() => execute(true)}
            >
              Submit solution <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="runtime-note">
            <Icon name="shield" size={12} /> Runs on your device · 5s execution
            limit · restricted network
          </div>
        </section>
      </div>
      {mode !== "exam" && (
        <button
          className="tutor-fab"
          onClick={() => onTutor({ lesson: lesson.id, code })}
        >
          <Icon name="sparkles" size={18} /> Ask your tutor <span>↗</span>
        </button>
      )}
      {reset && (
        <Modal
          title="Start with a clean slate?"
          subtitle="This replaces your current draft. Submitted attempts stay in History."
          onClose={() => setReset(false)}
        >
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              Keep my code
            </button>
            <button
              className="button primary"
              onClick={() => {
                setCode(
                  mode === "exam"
                    ? blankStarter
                    : mode === "debug"
                      ? brokenStarter
                      : lesson.starter,
                );
                setResult(null);
                setReset(false);
              }}
            >
              Reset code
            </button>
          </div>
        </Modal>
      )}
      {success && (
        <Modal
          title={
            success.earned
              ? "Look at you, writing real code."
              : "Still got it. Nicely done."
          }
          subtitle="Every test passed. That’s understanding you earned."
          onClose={() => setSuccess(null)}
        >
          <div className="success-medal">
            <Icon name="gem" size={46} />
            <div className="confetti">
              ✦ <span>✧</span> ✦
            </div>
          </div>
          <div className="earned-xp">
            {success.earned ? `+${success.earned} XP` : "Practice complete"}
          </div>
          <p className="success-explanation">{lesson.explain}</p>
          <div className="success-stats">
            <span>
              <Icon name="success" /> {lesson.tests.length} tests passed
            </span>
            <span>
              <Icon name="clock" /> {Math.floor(elapsed / 60)}m {elapsed % 60}s
            </span>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setSuccess(null)}
            >
              Review my code
            </button>
            <button
              className="button primary"
              onClick={() => {
                setSuccess(null);
                onNext();
              }}
            >
              Keep learning <Icon name="arrow" size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function ProjectWorkspace({ project, state, setState, notify, onBack }) {
  const [files, setFiles] = useState(
    state.projects[project.id] || project.files,
  );
  const [file, setFile] = useState(Object.keys(files)[0]);
  const [preview, setPreview] = useState("");
  const [tab, setTab] = useState("Console");
  const [adding, setAdding] = useState(false);
  const [filename, setFilename] = useState("");
  const [saved, setSaved] = useState(true);
  const { run, running, result, phase } = useRunner();
  const initial = useRef(true);
  const pendingProject = useRef({ id: project.id, files });
  pendingProject.current = { id: project.id, files };
  useEffect(() => {
    const flush = () =>
      fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: pendingProject.current }),
        keepalive: true,
      }).catch(() => {});
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    setSaved(false);
    const timer = setTimeout(
      () =>
        api("state", { project: { id: project.id, files } }, "PATCH")
          .then((s) => {
            setState((p) => ({ ...p, projects: s.projects }));
            setSaved(true);
          })
          .catch((e) => notify(e.message, "error")),
      750,
    );
    return () => clearTimeout(timer);
  }, [files]);
  function buildPreview() {
    let html = files["index.html"] || "";
    html = html
      .replace(
        /<link[^>]+href=["']style.css["'][^>]*>/,
        "<style>" + files["style.css"] + "</style>",
      )
      .replace(
        /<script src=["']script.js["']><\/script>/,
        "<script>" + (files["script.js"] || "") + "</script>",
      );
    return (
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none';">` +
      html
    );
  }
  function showPreview() {
    setPreview(buildPreview());
  }
  function download() {
    const content =
      project.language === "html"
        ? buildPreview()
        : Object.entries(files)
            .map(([n, c]) => `# FILE: ${n}\n${c}`)
            .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      project.language === "html" ? "my-portfolio.html" : "my-calculator.py";
    a.click();
    URL.revokeObjectURL(url);
    notify("Project exported. Keep building!");
  }
  useEffect(() => {
    if (project.language === "html") showPreview();
  }, []);
  const lang = file.endsWith(".css")
    ? "css"
    : file.endsWith(".js")
      ? "javascript"
      : file.endsWith(".html")
        ? "html"
        : file.endsWith(".json")
          ? "json"
          : "python";
  return (
    <div className="project-workspace">
      <div className="workspace-breadcrumb">
        <button onClick={onBack}>
          <Icon name="back" size={16} />
          Projects
        </button>
        <span>/</span>
        <span>{project.type}</span>
        <div className="workspace-top-right">
          <Pill color="mint">BUILD MODE</Pill>
          <button className="button secondary small" onClick={download}>
            <Icon name="download" size={14} />
            Export
          </button>
        </div>
      </div>
      <div className="project-instructions">
        <Icon name="folder" />
        <div>
          <strong>{project.title}</strong>
          <p>
            {project.language === "html"
              ? "Start by changing the heading in index.html. Try a different background in style.css, then preview. HTML defines structure, CSS defines appearance, and JavaScript adds behavior."
              : "Build add, subtract, multiply, and divide functions. Test each with positive, negative, and zero values. Your previous lessons are the toolkit."}
          </p>
        </div>
      </div>
      <div className="project-layout">
        <aside className="file-explorer">
          <div>
            EXPLORER
            <button
              className="icon-button"
              aria-label="Add file"
              onClick={() => setAdding(true)}
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
          <span className="folder-label">
            <Icon name="down" size={12} />
            {project.id}
          </span>
          {Object.keys(files).map((n) => (
            <button
              key={n}
              className={file === n ? "active" : ""}
              onClick={() => setFile(n)}
            >
              <Icon name="file" size={15} />
              {n}
            </button>
          ))}
          <div className="explorer-note">
            {project.language === "html"
              ? "Preview bundles index.html, style.css, and script.js. Additional files are saved for export individually."
              : "Python files can import other .py files in this project."}
          </div>
        </aside>
        <section className="project-editor">
          <div className="editor-toolbar">
            <span>
              <Icon name="file" size={14} />
              {file}
            </span>
            <span className="saved-indicator">
              {saved ? "Saved" : "Saving…"}
            </span>
          </div>
          <CodeEditor
            value={files[file]}
            language={lang}
            onChange={(v) => setFiles((p) => ({ ...p, [file]: v }))}
          />
        </section>
        <section className="preview-pane">
          <div className="editor-toolbar">
            <span>
              <Icon
                name={project.language === "html" ? "globe" : "terminal"}
                size={14}
              />
              {project.language === "html" ? "Live preview" : "Python console"}
            </span>
            <button
              className="button primary small"
              disabled={running}
              onClick={() =>
                project.language === "html"
                  ? showPreview()
                  : run(files[file], "python", [], files)
              }
            >
              <Icon name="play" size={13} />
              {project.language === "html" ? "Refresh" : "Run"}
            </button>
          </div>
          {project.language === "html" ? (
            <iframe
              title="Your website preview"
              sandbox="allow-scripts"
              srcDoc={preview}
            />
          ) : (
            <ConsoleOutput
              result={result}
              running={running}
              phase={phase}
              tab={tab}
              setTab={setTab}
            />
          )}
        </section>
      </div>
      <div className="project-bottom">
        <span>
          <Icon name="shield" size={14} />
          Your project is saved automatically. Project work does not award
          mastery XP.
        </span>
        <button
          className="text-button"
          onClick={() => {
            const b = new Blob([files[file]], { type: "text/plain" });
            const u = URL.createObjectURL(b);
            const a = document.createElement("a");
            a.href = u;
            a.download = file;
            a.click();
            URL.revokeObjectURL(u);
          }}
        >
          Download current file <Icon name="download" size={14} />
        </button>
      </div>
      {adding && (
        <Modal title="Add a project file" onClose={() => setAdding(false)}>
          <label>
            File name
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={
                project.language === "html" ? "notes.json" : "helpers.py"
              }
            />
          </label>
          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => {
                if (
                  !/^[\w-]+\.(html|css|js|json|py)$/.test(filename) ||
                  files[filename] !== undefined
                ) {
                  notify(
                    "Choose a new filename ending in .html, .css, .js, .json, or .py.",
                    "error",
                  );
                  return;
                }
                setFiles((p) => ({ ...p, [filename]: "" }));
                setFile(filename);
                setAdding(false);
                setFilename("");
              }}
            >
              Create file
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Playground({ notify }) {
  const samples = {
    python:
      'print("Hello from Python!")\n\nfor number in [1, 2, 3]:\n    print(number * 2)\n',
    javascript:
      'const name = "Developer";\nconsole.log(`Hello, ${name}!`);\n\nconst scores = [2, 4, 6];\nconsole.log(scores.map(score => score * 2));',
    typescript:
      'type Learner = { name: string; xp: number };\nconst learner: Learner = { name: "Developer", xp: 50 };\nconsole.log(learner.name, learner.xp);',
    sql: "CREATE TABLE learners (name TEXT, xp INTEGER);\nINSERT INTO learners VALUES ('Ada', 100), ('Lin', 75);\nSELECT * FROM learners ORDER BY xp DESC;",
  };
  const [lang, setLang] = useState("python");
  const [drafts, setDrafts] = useState(() => {
    try {
      return {
        ...samples,
        ...JSON.parse(localStorage.getItem("forge-playground") || "{}"),
      };
    } catch {
      return samples;
    }
  });
  const [tab, setTab] = useState("Console");
  const { run, running, result, phase } = useRunner();
  function change(v) {
    setDrafts((p) => {
      const next = { ...p, [lang]: v };
      localStorage.setItem("forge-playground", JSON.stringify(next));
      return next;
    });
  }
  return (
    <div className="playground">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE ROOM TO EXPERIMENT</div>
          <h1>Your code. Your playground.</h1>
          <p>
            Break things, try ideas, and discover what happens. No scores
            attached.
          </p>
        </div>
        <Pill color="mint">
          <span className="green-dot" />
          Real execution
        </Pill>
      </div>
      <div className="playground-toolbar">
        <select
          aria-label="Playground language"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {Object.keys(samples).map((l) => (
            <option key={l} value={l}>
              {l === "sql" ? "SQL (SQLite)" : l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
        <span>
          {lang === "typescript"
            ? "TypeScript is transpiled to JavaScript before running."
            : lang === "sql"
              ? "A fresh in-memory database is created for every run."
              : "Isolated browser worker · restricted network · 5s execution limit"}
        </span>
        <button
          className="button primary small"
          disabled={running}
          onClick={() => run(drafts[lang], lang)}
        >
          <Icon name="play" size={15} />
          {running ? "Running…" : "Run code"}
        </button>
      </div>
      <div className="playground-editor">
        <CodeEditor value={drafts[lang]} onChange={change} language={lang} />
      </div>
      <ConsoleOutput
        result={result}
        running={running}
        phase={phase}
        tab={tab}
        setTab={setTab}
      />
      <p className="playground-note">
        <Icon name="help" size={14} />
        Drafts are saved in this browser. For multi-file HTML/CSS/JavaScript and
        a live preview, open the portfolio project.
      </p>
    </div>
  );
}
