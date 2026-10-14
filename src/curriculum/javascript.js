export const javascriptLessons = [
  {
    id: "js-first-line",
    title: "Say hello in JavaScript",
    concept: "JavaScript · Output & syntax",
    short: "Your first instruction in the language of the web.",
    duration: 10,
    xp: 50,
    language: "javascript",
    file: "hello.js",
    description:
      "JavaScript brings websites to life. Start with the language itself: one instruction, one observable result.",
    paragraph:
      "A program is a list of instructions. JavaScript runs in browsers and in environments such as Node.js. This workspace runs it in a browser worker, separate from the page, so there is no document or HTML to manipulate here. console.log(value) displays a value in the console. Text between matching quotes is a string. The dot selects log on the console object. Parentheses call it with an argument. A semicolon marks the end of a statement. JavaScript can insert some semicolons automatically, but writing them consistently makes these first examples clear. // starts a comment that lasts to the end of the line.",
    example: '// This line is a comment.\nconsole.log("Hello, JavaScript!");',
    symbols: [
      ["console", "A built-in object with tools for inspecting your program."],
      [".log", "Select the output method on console."],
      ['("Hello, JavaScript!")', "Call the method with one string argument."],
      [";", "End this statement."],
      ["//", "The rest of this line is a comment, not an instruction."],
    ],
    task: "Write two console.log statements. The first must display Hello, JavaScript! and the second must display I can write real code. Match spaces, punctuation, and capitalization. Do not print extra lines.",
    starter: "// Write your two messages below.\n\n",
    tests: [
      { label: "Greet JavaScript", expected: "Hello, JavaScript!" },
      { label: "Declare your next step", expected: "I can write real code." },
    ],
    hints: [
      "Use one console.log call for each line of output.",
      "Each message belongs inside matching quotes and parentheses.",
      "The text is case-sensitive. Keep punctuation inside the quotes.",
      'The pattern is console.log("your message"); on each line.',
    ],
    solution:
      'console.log("Hello, JavaScript!");\nconsole.log("I can write real code.");',
    explain:
      "The program runs top to bottom. Each console.log call writes one line. Quotes describe a string in your source code; they do not appear in the output.",
    predict: {
      code: '// console.log("First");\nconsole.log("Second");',
      answer: "Second",
      options: ["First\nSecond", "Second", "Nothing"],
    },
    debugStarter:
      'console.Log("Hello, JavaScript!");\nconsole.log("I can write real code.");',
    debugTask:
      "The first instruction fails, so the second never runs. JavaScript names are case-sensitive. Find the incorrect method name and correct it.",
  },
  {
    id: "js-values",
    title: "Name it. Store it. Change it.",
    concept: "JavaScript · Values & bindings",
    short: "Make sense of const, let, numbers, and strings.",
    duration: 15,
    xp: 75,
    language: "javascript",
    file: "values.js",
    description:
      "Variables give values a name. JavaScript asks you to be explicit about whether that name can point to a different value later.",
    paragraph:
      'const creates a binding that cannot be reassigned. let creates one that can be reassigned. Both need a name. The equals sign assigns the value on the right; it is not an equality test. JavaScript numbers can represent whole numbers or decimals, without quotation marks. A quoted number is a string. + adds numbers, but concatenates strings when a string is involved: 2 + 3 is 5, while "2" + 3 is "23". * multiplies, - subtracts, and / divides. Multiplication happens before addition and subtraction. Use descriptive camelCase names such as finalCost. const protects the binding, not the contents of arrays or objects; you will learn those later.',
    example:
      "const price = 8;\nlet quantity = 2;\nquantity = quantity + 1;\nconst total = price * quantity;\nconsole.log(total);",
    symbols: [
      ["const", "Declare a binding you will not reassign."],
      ["let", "Declare a binding you can reassign later."],
      ["=", "Assign the evaluated right-hand value to the left-hand name."],
      ["price * quantity", "Multiply two numbers before assigning the result."],
      ['"2" vs 2', "A string containing a digit is not a numeric value."],
    ],
    task: "Create price with numeric value 6, quantity with numeric value 4, and discount with numeric value 5. Calculate total as price times quantity minus discount. Log total once. Use const or let; do not simply hard-code the final result.",
    starter:
      "// Declare the three numeric inputs.\n\n// Calculate total, then display it.\n",
    tests: [
      { label: "Calculate the final cost", expected: "19" },
      {
        label: "Build total from the input arithmetic",
        sourceCheck: "arithmetic-total",
      },
      {
        label: "Keep input values numeric",
        expression: "price === 6 && quantity === 4 && discount === 5",
      },
      {
        label: "Store the correct total",
        expression: "total === price * quantity - discount",
        hidden: true,
      },
    ],
    hints: [
      "The values are numbers, so do not surround them with quotes.",
      "Assign each value before referring to it in your total expression.",
      "Multiplication comes first; then subtract the discount.",
      "Declare the three inputs. Declare total from their expression. Log total without quotes.",
    ],
    solution:
      "const price = 6;\nconst quantity = 4;\nconst discount = 5;\nconst total = price * quantity - discount;\nconsole.log(total);",
    explain:
      "The variables contain numbers, so arithmetic stays numeric. The calculation is 6 × 4 − 5, giving 19. Logging the variable reads its value rather than displaying its name.",
    predict: {
      code: 'console.log("2" + 3);\nconsole.log(2 + 3);',
      answer: "23\n5",
      options: ["5\n5", "23\n5", "23\n23"],
    },
    debugStarter:
      'const price = "6";\nconst quantity = 4;\nconst discount = 5;\nconst total = price * quantity - discount;\nconsole.log(total);',
    debugTask:
      "The displayed total happens to be correct because multiplication coerces this string to a number, but the input type test fails. Fix the input representation rather than relying on coercion.",
  },
  {
    id: "js-functions",
    title: "Give your code a reusable job",
    concept: "JavaScript · Functions & returns",
    short: "Turn one operation into a function with an input and an output.",
    duration: 16,
    xp: 100,
    language: "javascript",
    file: "functions.js",
    description:
      "A function is a reusable set of instructions. Define it once, then call it with different arguments.",
    paragraph:
      "function introduces a function declaration. Its name follows, then parameters in parentheses. A parameter is the local name for an input. Curly braces enclose the body; indentation makes it readable but the braces determine the block. return hands a result back to the caller and ends that call. console.log only displays a value—it does not return that value from your function. A function with no return produces undefined. A function body runs when the function is called, not just when it is declared. Names declared inside a function belong to its local scope.",
    example:
      "function double(number) {\n  return number * 2;\n}\n\nconsole.log(double(4));",
    symbols: [
      ["function", "Declare a reusable function."],
      ["double(number)", "Name the function and its parameter."],
      ["{ }", "Enclose the instructions belonging to this function."],
      ["return", "Send a value to the caller and finish this call."],
      ["double(4)", "Call the function with 4 as its argument."],
    ],
    task: 'Declare greet(name). Return the string Hello, followed by a space, the supplied name, and an exclamation mark. For example, greet("Ada") returns "Hello, Ada!". Return the string rather than only logging it.',
    starter:
      "// Declare greet with one parameter named name.\n\n// You can log a call to try your function.\n",
    tests: [
      { label: "Greet Ada", expression: 'greet("Ada") === "Hello, Ada!"' },
      {
        label: "Use a different argument",
        expression: 'greet("Lin") === "Hello, Lin!"',
      },
      {
        label: "Preserve spaces and handle an empty name",
        expression:
          'greet("Ada Lovelace") === "Hello, Ada Lovelace!" && greet("") === "Hello, !"',
        hidden: true,
      },
    ],
    hints: [
      "Use + to join the three string pieces.",
      "The function must return a value. Logging alone leaves its return value undefined.",
      "Keep the space after the comma inside your first string.",
      "Declare function greet(name) with a body that returns prefix + name + punctuation.",
    ],
    solution:
      'function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("Ada"));',
    explain:
      "Each call receives its own name argument. The return expression combines three strings into one result. The caller decides whether to log it or use it somewhere else.",
    predict: {
      code: "function show(number) {\n  console.log(number);\n}\nconsole.log(show(7));",
      answer: "7\nundefined",
      options: ["7", "7\nundefined", "undefined"],
    },
    debugStarter:
      'function greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\nconsole.log(greet("Ada"));',
    debugTask:
      "The greeting is visible, but every return-value test fails. Inspect the difference between displaying a value and handing it back to the caller.",
  },
  {
    id: "js-decisions",
    title: "Make the right call",
    concept: "JavaScript · Booleans & decisions",
    short: "Choose a path using comparisons and if statements.",
    duration: 16,
    xp: 100,
    language: "javascript",
    file: "decisions.js",
    description:
      "Useful programs make decisions. A boolean gives a condition one of two values: true or false.",
    paragraph:
      'if (condition) runs a block when its condition is true. else handles the other case. > means greater than, and >= includes the boundary. === compares both type and value without converting them; !== checks strict inequality. Do not confuse = (assignment) with === (comparison). JavaScript booleans are lowercase true and false. Strings such as "false" are not booleans and are truthy in an if condition. Prefer explicit comparisons when you are learning. A return inside a branch exits the function immediately, so another return afterward can handle the remaining case.',
    example:
      "function isReady(score) {\n  if (score >= 10) {\n    return true;\n  }\n  return false;\n}\n\nconsole.log(isReady(10));",
    symbols: [
      [
        "if (condition)",
        "Evaluate a condition before deciding to run the block.",
      ],
      [">=", "Greater than or equal to; the boundary counts."],
      ["===", "Strict equality: both the type and the value must match."],
      ["true / false", "Boolean values, without quotation marks."],
      ["else { }", "A block for when the if condition is false."],
    ],
    task: 'Declare access(age). If age is at least 18, return "Welcome". Otherwise return "Not yet". The input is always a nonnegative number. Make sure the exact boundary 18 is accepted.',
    starter:
      "function access(age) {\n  // Make the decision, then return the right message.\n}\n",
    tests: [
      { label: "An adult can enter", expression: 'access(25) === "Welcome"' },
      {
        label: "A younger visitor waits",
        expression: 'access(12) === "Not yet"',
      },
      {
        label: "Include the boundary",
        expression: 'access(18) === "Welcome" && access(17) === "Not yet"',
        hidden: true,
      },
      {
        label: "Handle zero",
        expression: 'access(0) === "Not yet"',
        hidden: true,
      },
    ],
    hints: [
      "Compare the number argument with the threshold.",
      "Use the comparison that includes equality, not only greater-than.",
      "Return one string inside the if block and the other afterward, or use else.",
      "If age is at least 18, return the welcome message; otherwise return the waiting message.",
    ],
    solution:
      'function access(age) {\n  if (age >= 18) {\n    return "Welcome";\n  }\n  return "Not yet";\n}',
    explain:
      "The comparison includes 18. A matching branch returns immediately, so the final return runs only for younger ages. Boundary tests help catch an easy-to-miss > versus >= mistake.",
    predict: {
      code: 'console.log(3 === "3");\nconsole.log(3 === 3);',
      answer: "false\ntrue",
      options: ["true\ntrue", "false\ntrue", "false\nfalse"],
    },
    debugStarter:
      'function access(age) {\n  if (age > 18) {\n    return "Welcome";\n  }\n  return "Not yet";\n}',
    debugTask:
      "Most visitors are classified correctly, but the exact threshold is wrong. Change the boundary check, not the test data.",
  },
  {
    id: "js-collections",
    title: "Keep related values together",
    concept: "JavaScript · Arrays & objects",
    short: "Read collections and records without mixing them up.",
    duration: 18,
    xp: 125,
    language: "javascript",
    file: "collections.js",
    description:
      "An array keeps values in order. An object gives related values meaningful property names.",
    paragraph:
      'An array uses square brackets and comma-separated values. Its first index is zero, and its length property counts the items. An object uses curly braces with key: value pairs. Read a property with object.key or object["key"]. A missing property is undefined. const prevents reassignment of the binding, but does not freeze the object: item.quantity = 2 can still change a property. Reading a field does not mutate it. Default missing values explicitly—zero is a valid number, not the same as undefined. Array methods such as push(value) can append a value; you will use an accumulator in the next lesson.',
    example:
      'const items = ["pen", "book"];\nconst product = {name: items[0], price: 6};\nconsole.log(product.name);\nconsole.log(items.length);',
    symbols: [
      ['["pen", "book"]', "An array holding two strings in order."],
      ["items[0]", "Read the first element, using index zero."],
      ['{name: "pen", price: 6}', "An object with two named properties."],
      ["product.price", "Read the price property."],
      ["undefined", 'A missing value, not the string "undefined".'],
    ],
    task: "Declare lineTotal(item). The object has a numeric price and may have a numeric quantity. Return price times quantity, using quantity 1 only when it is undefined. A quantity of 0 must produce 0. Do not mutate the object.",
    starter:
      "function lineTotal(item) {\n  // Read the values, choose a default, and calculate.\n}\n",
    tests: [
      {
        label: "Multiply the record values",
        expression: "lineTotal({price: 6, quantity: 4}) === 24",
      },
      {
        label: "Default a missing property",
        expression: "lineTotal({price: 7}) === 7",
      },
      {
        label: "Respect a quantity of zero",
        expression: "lineTotal({price: 9, quantity: 0}) === 0",
        hidden: true,
      },
      {
        label: "Leave the object unchanged",
        expression:
          "(() => { const item = {price: 5}; return lineTotal(item) === 5 && JSON.stringify(item) === '{\"price\":5}'; })()",
        hidden: true,
      },
    ],
    hints: [
      "Read item.price and item.quantity. A missing quantity evaluates to undefined.",
      "Use a let variable for quantity if you need to replace a missing value.",
      "Compare quantity === undefined. Do not treat every falsy value as missing.",
      "Read quantity; if it is undefined, assign 1; return price multiplied by quantity.",
    ],
    solution:
      "function lineTotal(item) {\n  let quantity = item.quantity;\n  if (quantity === undefined) {\n    quantity = 1;\n  }\n  return item.price * quantity;\n}",
    explain:
      "The local variable can be reassigned without changing the input object. The explicit undefined check preserves zero. This distinction matters for prices, quantities, and form input.",
    predict: {
      code: "const item = {quantity: 0};\nconsole.log(item.quantity);\nconsole.log(item.missing);",
      answer: "0\nundefined",
      options: ["0\nundefined", "1\nundefined", "0\nnull"],
    },
    debugStarter:
      "function lineTotal(item) {\n  if (item.quantity === undefined) {\n    item.quantity = 1;\n  }\n  return item.price * item.quantity;\n}",
    debugTask:
      "The numeric answers are correct, but this function modifies an object supplied by its caller. Use a local variable for the default instead.",
  },
  {
    id: "js-loops",
    title: "One instruction, every item",
    concept: "JavaScript · Loops & accumulation",
    short: "Visit an array and build a result step by step.",
    duration: 17,
    xp: 125,
    language: "javascript",
    file: "loops.js",
    description:
      "A loop repeats a block so you do not have to write the same instruction over and over.",
    paragraph:
      "for (const item of items) takes each array value in order and assigns it to item for that iteration. The braces contain the loop body. A running total, or accumulator, starts outside the loop and is updated inside it. Use let for that total because each update reassigns it. The loop variable can use const: each iteration creates a new binding. Put return after the loop, not inside it, so every item is included. An empty array performs zero iterations, leaving your initial total unchanged.",
    example:
      "const numbers = [2, 4, 6];\nlet total = 0;\nfor (const number of numbers) {\n  total = total + number;\n}\nconsole.log(total);",
    symbols: [
      ["for", "Start a repeating instruction."],
      [
        "const number of numbers",
        "Take array values one at a time, not their indexes.",
      ],
      [
        "let total = 0",
        "Initialize a reassignable accumulator before the loop.",
      ],
      ["total = total + number", "Add the current value to the running total."],
      ["return after }", "Finish only after the loop has visited every item."],
    ],
    task: "Declare sumPositive(values). Return the sum of only the numbers greater than zero in the input array. The array contains numbers and may be empty. Use a loop and a running total. Return 0 if no number qualifies.",
    starter:
      "function sumPositive(values) {\n  // Start a total, loop, select positive values, return.\n}\n",
    tests: [
      { label: "Practice a loop", sourceCheck: "loop" },
      {
        label: "Add positive values",
        expression: "sumPositive([2, 4, 6]) === 12",
      },
      {
        label: "Skip zero and negative values",
        expression: "sumPositive([-3, 0, 5, 2]) === 7",
      },
      {
        label: "Handle an empty array",
        expression: "sumPositive([]) === 0",
        hidden: true,
      },
      {
        label: "No qualifying numbers",
        expression: "sumPositive([-8, -2, 0]) === 0",
        hidden: true,
      },
      {
        label: "Visit the whole array",
        expression: "sumPositive([1, 1, 1, 1, 1]) === 5",
        hidden: true,
      },
    ],
    hints: [
      "Start with zero outside the loop, so an empty array already works.",
      "Inside the loop, use an if statement to decide whether to add the value.",
      "Use let for the accumulator. Return only after the closing brace of the loop.",
      "Create total = 0; for each value, add it if positive; return total.",
    ],
    solution:
      "function sumPositive(values) {\n  let total = 0;\n  for (const value of values) {\n    if (value > 0) {\n      total = total + value;\n    }\n  }\n  return total;\n}",
    explain:
      "The condition selects values, and the accumulator combines them. No matching values means no updates, so the initial zero is the correct result. The return is outside the loop.",
    predict: {
      code: "let total = 0;\nfor (const n of [1, 2, 3]) {\n  total = total + n;\n}\nconsole.log(total);",
      answer: "6",
      options: ["3", "6", "123"],
    },
    debugStarter:
      "function sumPositive(values) {\n  let total = 0;\n  for (const value of values) {\n    if (value > 0) {\n      total = total + value;\n    }\n    return total;\n  }\n}",
    debugTask:
      "Only the first item is considered, and an empty array returns undefined. Find the return that finishes the function too early.",
  },
  {
    id: "js-json",
    title: "Turn JSON into useful data",
    concept: "JavaScript · JSON & error handling",
    short: "Parse text, handle malformed input, and return a useful value.",
    duration: 19,
    xp: 150,
    language: "javascript",
    file: "json.js",
    description:
      "JSON is text. JavaScript objects are live values. Knowing which one you have prevents a whole family of bugs.",
    paragraph:
      "JSON.parse(text) converts valid JSON text into JavaScript values. JSON.stringify(value) turns supported JavaScript data back into JSON text. JSON uses double-quoted keys and strings, plus true, false, and null. Parsing malformed text throws an exception, which interrupts normal execution. try encloses a risky operation. catch (error) runs if that operation throws; error names the exception object. Only put the operations you intend to handle inside try. In this task, all valid JSON inputs represent arrays, so their length is the number of records. The result null represents no usable count; it is different from a valid count of zero.",
    example:
      'const text = \'[{"name":"Ada"},{"name":"Lin"}]\';\nconst records = JSON.parse(text);\nconsole.log(records.length);\nconsole.log(JSON.stringify(records));',
    symbols: [
      ["JSON.parse(text)", "Parse a string into JavaScript values."],
      ["JSON.stringify(value)", "Serialize supported values to JSON text."],
      ["try { }", "Attempt code that may throw an exception."],
      [
        "catch (error) { }",
        "Handle an exception from the associated try block.",
      ],
      ["null", "An intentional absence of a useful result, not 0."],
    ],
    task: "Declare countRecords(text). Valid JSON inputs are always arrays. Return their length. If JSON.parse throws because the text is malformed, return null. Keep the parsing operation inside the try block. Do not confuse the input string length with the parsed array length.",
    starter:
      "function countRecords(text) {\n  // Parse safely, then count the records.\n}\n",
    tests: [
      {
        label: "Count parsed records",
        expression: 'countRecords(\'[{"name":"Ada"},{"name":"Lin"}]\') === 2',
      },
      {
        label: "An empty array is a valid zero",
        expression: 'countRecords("[]") === 0',
      },
      {
        label: "Handle malformed JSON text",
        expression:
          'countRecords("not json") === null && countRecords("[") === null',
        hidden: true,
      },
      {
        label: "Do not count text characters",
        expression: 'countRecords(\'[ "a long string", "another" ]\') === 2',
        hidden: true,
      },
    ],
    hints: [
      "Parse first. Only then can you read the array length.",
      "JSON.parse can throw before the next line runs, so it belongs inside try.",
      "The catch block should return null without quotation marks.",
      "Try parsing and returning records.length; catch a parse failure and return null.",
    ],
    solution:
      "function countRecords(text) {\n  try {\n    const records = JSON.parse(text);\n    return records.length;\n  } catch (error) {\n    return null;\n  }\n}",
    explain:
      "The caller receives a number for valid data and null for malformed data. Returning zero for an empty array preserves the difference between nothing in the collection and a parsing failure.",
    predict: {
      code: 'const text = "[1,2]";\nconsole.log(text.length);\nconsole.log(JSON.parse(text).length);',
      answer: "5\n2",
      options: ["2\n2", "5\n2", "5\n5"],
    },
    debugStarter:
      "function countRecords(text) {\n  const records = JSON.parse(text);\n  try {\n    return records.length;\n  } catch (error) {\n    return null;\n  }\n}",
    debugTask:
      "A try block exists, but malformed input still throws. Which operation needs to be inside that protected block?",
  },
  {
    id: "js-async",
    title: "Wait for a result, not a guess",
    concept: "JavaScript · Promises & async/await",
    short: "Use an asynchronous value only after it is ready.",
    duration: 20,
    xp: 175,
    language: "javascript",
    file: "async.js",
    description:
      "A promise represents a result that may arrive later—or fail. await lets you use that eventual result in a readable sequence.",
    paragraph:
      "A function is also a value: you can pass it as an argument and call it through a parameter name. An async function always returns a Promise. Inside it, await waits for a promise to settle; it gives you the fulfilled value or throws the rejection reason. While waiting, JavaScript can do other work. Promise.resolve(value) creates an already-fulfilled promise, useful for learning and tests. try / catch can handle a rejection when the awaited operation is inside try. Without await, you still have a promise object, not its future value. This lesson uses real promises and provided loader functions; it does not make network requests. Fetch and browser events come in later courses.",
    example:
      "async function loadScore() {\n  return 7;\n}\n\nasync function showScore() {\n  const score = await loadScore();\n  console.log(score);\n}\n\nawait showScore();",
    symbols: [
      [
        "async function",
        "Declare a function whose return value is wrapped in a Promise.",
      ],
      ["await", "Wait for fulfillment or throw on rejection."],
      [
        "loadScore()",
        "Call a function; an async function call returns a promise.",
      ],
      [
        "Promise.resolve(7)",
        "Create a real fulfilled promise carrying the number 7.",
      ],
      [
        "catch (error)",
        "Handle a thrown error or an awaited rejection in the try block.",
      ],
    ],
    task: "Declare async function doubleLoaded(loadNumber). The parameter is a function you can call; it returns a promise for a number. Await it and return twice the number. If the loader throws or its promise rejects, return null. Do not log instead of returning.",
    starter:
      "async function doubleLoaded(loadNumber) {\n  // Call the loader once, await its value, and handle errors.\n}\n",
    tests: [
      {
        label: "Wait for a real promise",
        expression:
          "(await doubleLoaded(async function () { return 6; })) === 12",
      },
      {
        label: "A zero result is valid",
        expression:
          "(await doubleLoaded(async function () { return 0; })) === 0",
      },
      {
        label: "Handle a rejected loader",
        expression:
          '(await doubleLoaded(async function () { throw new Error("offline"); })) === null',
        hidden: true,
      },
      {
        label: "Call the loader only once",
        expression:
          "await (async () => { let calls = 0; const result = await doubleLoaded(async () => { calls += 1; return -3; }); return calls === 1 && result === -6; })()",
        hidden: true,
      },
      {
        label: "Wait for a delayed result",
        expression:
          "(await doubleLoaded(() => new Promise(resolve => setTimeout(() => resolve(5), 20)))) === 10",
        hidden: true,
      },
    ],
    hints: [
      "Calling loadNumber() gives you a promise. The numeric value comes from awaiting it.",
      "Put both the call and the await inside try so either kind of failure reaches catch.",
      "Return the doubled value inside try and null inside catch.",
      "Try: number = await loadNumber(); return number * 2. Catch: return null.",
    ],
    solution:
      "async function doubleLoaded(loadNumber) {\n  try {\n    const number = await loadNumber();\n    return number * 2;\n  } catch (error) {\n    return null;\n  }\n}",
    explain:
      "await unwraps the successful promise value before multiplication. A thrown error or rejected promise jumps to catch. Returning null makes failure distinguishable from the valid numeric result zero.",
    predict: {
      code: "async function answer() {\n  return 42;\n}\nconsole.log(await answer());",
      answer: "42",
      options: ["undefined", "42", "A promise is printed"],
    },
    debugStarter:
      "async function doubleLoaded(loadNumber) {\n  try {\n    const number = loadNumber();\n    return number * 2;\n  } catch (error) {\n    return null;\n  }\n}",
    debugTask:
      "The loader succeeds, but multiplication receives a promise instead of a number. Add the missing waiting step inside the protected block.",
  },
];

export const javascriptChallenge = {
  ...javascriptLessons[5],
  id: "js-parcel-checkout",
  title: "The parcel checkout",
  concept: "JavaScript · Records & aggregation",
  difficulty: "Easy",
  xp: 200,
  requires: ["js-loops"],
  file: "checkout.js",
  description:
    "A local maker packs orders into parcels. Calculate the bill for items that are actually in stock.",
  task: "Declare checkoutTotal(items). Each item has numeric price and quantity properties, and a boolean inStock property. Add price multiplied by quantity only for items whose inStock is true. Return the total. Do not change the items or their order. An empty order returns 0.",
  starter:
    "function checkoutTotal(items) {\n  // Select the available items and accumulate their cost.\n}\n",
  constraints: [
    "0–200 item objects; all required properties exist.",
    "price and quantity are integers from 0 to 10,000.",
    "inStock is always a boolean.",
  ],
  examples: [
    ["[{price: 5, quantity: 3, inStock: true}]", "15"],
    ["[{price: 8, quantity: 2, inStock: false}]", "0"],
  ],
  tests: [
    {
      label: "Calculate one available item",
      expression: "checkoutTotal([{price:5,quantity:3,inStock:true}]) === 15",
    },
    {
      label: "Skip unavailable stock",
      expression:
        "checkoutTotal([{price:5,quantity:2,inStock:true},{price:90,quantity:1,inStock:false}]) === 10",
    },
    {
      label: "Empty order",
      expression: "checkoutTotal([]) === 0",
      hidden: true,
    },
    {
      label: "Zero quantities stay zero",
      expression: "checkoutTotal([{price:9,quantity:0,inStock:true}]) === 0",
      hidden: true,
    },
    {
      label: "Do not mutate input",
      expression:
        "(() => { const items = [{price:2,quantity:3,inStock:true},{price:7,quantity:1,inStock:true}]; const before = JSON.stringify(items); return checkoutTotal(items) === 13 && JSON.stringify(items) === before; })()",
      hidden: true,
    },
  ],
  hints: [
    "Combine a loop, a condition, and a running total.",
    "Read properties on each item, not on the items array itself.",
    "Only add a line cost when the item is in stock.",
    "Start total at zero; for each available item add price times quantity; return the total after the loop.",
  ],
  solution:
    "function checkoutTotal(items) {\n  let total = 0;\n  for (const item of items) {\n    if (item.inStock === true) {\n      total = total + item.price * item.quantity;\n    }\n  }\n  return total;\n}",
  explain:
    "The accumulator changes, but the input records do not. Filtering by the boolean before adding the line cost avoids charging for unavailable products.",
  complexity:
    "O(n) time for n items and O(1) auxiliary space, given bounded numeric inputs.",
  debugStarter:
    "function checkoutTotal(items) {\n  let total = 0;\n  for (const item of items) {\n    total = total + item.price * item.quantity;\n  }\n  return total;\n}",
  debugTask:
    "The total includes products that cannot be shipped. Find the missing eligibility check.",
};
