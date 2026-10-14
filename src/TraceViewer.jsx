import React, { useEffect, useState } from "react";
import { Icon, Pill } from "./ui.jsx";
import { explainError } from "./feedback.js";
export function ErrorGuide({ error, language }) {
  const advice = explainError(error, language);
  if (!advice) return null;
  return (
    <div className="error-guide">
      <Icon name="lightbulb" size={16} />
      <div>
        <strong>{advice.summary}</strong>
        <p>{advice.nextStep}</p>
        {advice.line && (
          <span>
            Start around line {advice.line}. The cause may be earlier.
          </span>
        )}
      </div>
    </div>
  );
}
export default function TraceViewer({ result, stale, onStep }) {
  const [index, setIndex] = useState(0);
  const steps = result?.trace || [];
  const step = steps[Math.min(index, Math.max(0, steps.length - 1))];
  useEffect(() => setIndex(0), [result]);
  useEffect(() => {
    onStep?.(stale ? null : step);
    return () => onStep?.(null);
  }, [step, stale, onStep]);
  if (stale)
    return (
      <div className="trace-empty">
        <Icon name="reset" size={20} />
        <p>Your code changed. Record a fresh trace to inspect this version.</p>
      </div>
    );
  if (!steps.length)
    return (
      <div className="trace-empty">
        <Icon name="bug" size={22} />
        <p>
          Choose <strong>Trace code</strong> to record the real lines and
          variable values of a Python run.
        </p>
        <small>
          Recorded replay, not a paused live process. No XP is awarded.
        </small>
      </div>
    );
  return (
    <div className="trace-viewer">
      <div className="trace-controls">
        <button
          className="icon-button"
          aria-label="Previous trace step"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          <Icon name="back" size={15} />
        </button>
        <span>
          Step {index + 1} / {steps.length}
        </span>
        <button
          className="icon-button"
          aria-label="Next trace step"
          disabled={index >= steps.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          <Icon name="arrow" size={15} />
        </button>
        <input
          aria-label="Trace step"
          type="range"
          min="0"
          max={steps.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        />
        <Pill color="blue">
          {step.event === "return" ? "RETURN" : "BEFORE"} LINE {step.line}
        </Pill>
      </div>
      <div className="trace-frame">
        <code>
          {step.function === "<" + "module>"
            ? "Top-level code"
            : `${step.function}()`}
        </code>
        <span>
          {step.event === "return"
            ? `Returned ${step.returnValue}`
            : "These are the values before the highlighted line runs."}
        </span>
      </div>
      <div className="trace-variables">
        {Object.entries(step.variables).length ? (
          Object.entries(step.variables).map(([name, value]) => (
            <div key={name}>
              <code>{name}</code>
              <pre>{value}</pre>
            </div>
          ))
        ) : (
          <p>No simple variables are assigned in this frame yet.</p>
        )}
      </div>
      <div className="trace-note">
        {result.traceTruncated
          ? "Showing the first 160 recorded events; the program continued under the normal time limit."
          : "Real Python execution · replay snapshots · values abbreviated for readability"}
      </div>
    </div>
  );
}
