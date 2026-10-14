// Deliberately small and transparent; these are coaching rules, not AI analysis.
export function explainError(error, language = "python") {
  if (!error) return null;
  const text = String(error);
  const lines = [...text.matchAll(/(?:student\.py["']?, line |line )(\d+)/g)];
  const line = lines.length ? Number(lines[lines.length - 1][1]) : null;
  if (language !== "python") {
    const jsPatterns = [
      [
        /time limit exceeded/i,
        "Your code did not finish in time.",
        "Look for a loop that never stops, or an awaited promise that never settles. A rejection is different from waiting forever.",
      ],
      [
        /ReferenceError/,
        "A name is missing or was used before it was initialized.",
        "Check spelling, capitalization, and scope. Declare the binding before reading it; a local function variable is not visible everywhere.",
      ],
      [
        /TypeError/,
        "An operation received a value it cannot use.",
        "Inspect values with console.log and typeof. A missing property is undefined, and a promise is not its eventual result. Check for an accidental const reassignment too.",
      ],
      [
        /SyntaxError/,
        "JavaScript could not read this statement.",
        "Check matching quotes, parentheses, and braces. Function and if bodies need braces. A JSON parsing error instead means the input text is malformed.",
      ],
      [
        /RangeError/,
        "The operation exceeded a valid range.",
        "Check numeric limits, array sizes, and whether a recursive function reaches a stopping condition.",
      ],
    ];
    const match = text.match(/student\.js:(\d+)/);
    const jsLine = match ? Math.max(1, Number(match[1]) - 3) : null;
    for (const [pattern, summary, nextStep] of jsPatterns)
      if (pattern.test(text)) return { summary, nextStep, line: jsLine };
    return {
      summary: "The program reported an error.",
      nextStep:
        "Read the exception name and message first. Inspect the values used just before that operation; catch only failures you expect.",
      line: jsLine,
    };
  }
  const patterns = [
    [
      /time limit exceeded/i,
      "Your program did not finish in time.",
      "Check that loops eventually stop. Try a smaller input or trace a bounded example first.",
    ],
    [
      /IndentationError|TabError/,
      "Python uses indentation to group instructions.",
      "Use four spaces consistently inside a function, if statement, or loop. Check the first line after a colon.",
    ],
    [
      /SyntaxError/,
      "Python could not read the structure of this code.",
      "Check matching quotes and parentheses, a missing colon, and the line just before the reported location.",
    ],
    [
      /NameError/,
      "A name was used before Python knew what it meant.",
      "Compare the spelling and capitalization with where you assigned or defined it. Was that line actually executed?",
    ],
    [
      /TypeError/,
      "An operation received a kind of value it cannot use.",
      "Check whether your values are strings, numbers, lists, or dictionaries. Printing type(value) can help you inspect one.",
    ],
    [
      /KeyError/,
      "That dictionary does not contain the requested key.",
      "Check the exact key spelling. If the key is optional, think about an appropriate default with get().",
    ],
    [
      /IndexError/,
      "The list or string does not have an item at that position.",
      "Indexes start at zero. Check the length first, especially for an empty input.",
    ],
    [
      /JSONDecodeError/,
      "The text is not valid JSON.",
      "Check double quotes around names and strings, matching brackets, and trailing commas. JSON uses true, false, and null.",
    ],
    [
      /ValueError/,
      "The value could not be interpreted in the requested way.",
      "For conversions, inspect the input. Decide whether to validate it first or handle the specific exception.",
    ],
    [
      /ZeroDivisionError/,
      "The program tried to divide by zero.",
      "Check the denominator before dividing. What should your function return when it is zero?",
    ],
    [
      /ModuleNotFoundError/,
      "This runtime could not find that module.",
      "Use Python standard-library modules or a saved .py file in this project. Network package installation is not enabled.",
    ],
  ];
  for (const [pattern, summary, nextStep] of patterns)
    if (pattern.test(text)) return { summary, nextStep, line };
  return {
    summary: "Something interrupted your program.",
    nextStep:
      "Read the last line of the error first, then trace backward to the value or instruction that caused it.",
    line,
  };
}
