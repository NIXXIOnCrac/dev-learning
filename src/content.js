import {
  javascriptLessons,
  javascriptChallenge,
} from "./curriculum/javascript.js";
import { pythonNext, inventoryBoss } from "./curriculum/python-next.js";
export const lessons = [
  {
    id: "first-line",
    title: "Your first line of Python",
    concept: "Output & strings",
    short: "Make the computer say hello.",
    duration: 8,
    xp: 50,
    language: "python",
    file: "hello.py",
    description:
      "Every great developer started with a single line. Today, you’ll write yours—and tell a computer exactly what to do.",
    paragraph:
      "A program is a set of instructions a computer follows. In Python, print() is an instruction that displays something in the console. Text in code is called a string. Put a string between matching quotation marks so Python knows it is text, not an instruction.",
    example: 'print("Hello, world!")',
    symbols: [
      ["print", "A built-in function that displays a value."],
      ["( )", "Parentheses hold the value you give to the function."],
      ['" "', "Quotation marks mark the beginning and end of a string."],
      [
        "Hello, world!",
        "The actual text. Spaces and punctuation inside quotes are part of it.",
      ],
    ],
    task: "Write a program that prints Hello, developer! exactly. Use print() and a string. Then write a second line that prints I am learning to code.",
    starter:
      "# Your journey starts here.\n# Print your two messages below.\n\n",
    tests: [
      { label: "Greet the developer", expected: "Hello, developer!" },
      { label: "Share your next step", expected: "I am learning to code" },
    ],
    hints: [
      "You need one print() function call for each message.",
      "Put your first message inside quotation marks, inside the parentheses.",
      "Write two separate lines. The first prints the greeting; the second prints your learning message.",
      'The shape is: print("your exact message")',
    ],
    solution: 'print("Hello, developer!")\nprint("I am learning to code")',
    explain:
      "Python runs from top to bottom. Each print() sends one string to the console and then starts a new line. The quotation marks are syntax—they do not appear in the output.",
    predict: {
      code: 'print("Code")\nprint("Craft")',
      answer: "Code\nCraft",
      options: ["Code Craft", "Code\nCraft", '"Code"\n"Craft"'],
    },
  },
  {
    id: "variables",
    title: "Give your ideas a name",
    concept: "Variables",
    short: "Store values and use them again.",
    duration: 12,
    xp: 75,
    language: "python",
    file: "variables.py",
    description:
      "Your program can remember things. Variables give those things a name.",
    paragraph:
      "A variable is a name that refers to a value. The equals sign assigns a value; it does not ask whether two things are equal. Python creates the variable when you first assign it. You can use that name later without quotation marks.",
    example: 'name = "Ada"\nprint(name)',
    symbols: [
      ["name", "The variable name. Choose a readable name with no spaces."],
      [
        "=",
        "Assignment: store the value on the right under the name on the left.",
      ],
      ['"Ada"', "A string value."],
      ["print(name)", "Look up the variable, then display its value."],
    ],
    task: "Create a variable called language with the string Python. Create a variable called year with the number 1991. Print language, then print year on a new line.",
    starter: "# Create your two variables.\n\n# Print their values.\n",
    tests: [
      { label: "Language is Python", expected: "Python" },
      { label: "Year is 1991", expected: "1991" },
      {
        label: "Values are stored in variables",
        expression: 'language == "Python" and year == 1991',
        hidden: true,
      },
    ],
    hints: [
      "Assign each value using =. Text needs quotes; a number does not.",
      "Use the exact variable names language and year.",
      "Create both variables before printing them.",
      "variable_name = value, then print(variable_name)",
    ],
    solution: 'language = "Python"\nyear = 1991\nprint(language)\nprint(year)',
    explain:
      "language refers to a string; year refers to an integer. print() accepts both. Names without quotes tell Python to retrieve a value.",
    predict: {
      code: "score = 5\nscore = 8\nprint(score)",
      answer: "8",
      options: ["5", "8", "58"],
    },
  },
  {
    id: "numbers",
    title: "Let Python do the math",
    concept: "Numbers & operators",
    short: "Turn values into useful calculations.",
    duration: 10,
    xp: 75,
    language: "python",
    file: "numbers.py",
    description:
      "Computers are great at calculations. Let’s give yours a little work.",
    paragraph:
      "An operator performs an action on values. + adds numbers, - subtracts, * multiplies, and / divides. Python follows normal mathematical precedence: multiplication before addition. Parentheses can change the order.",
    example: "price = 12\nquantity = 3\ntotal = price * quantity\nprint(total)",
    symbols: [
      ["12", "An integer: a whole number without quotation marks."],
      ["*", "Multiplication operator."],
      [
        "price * quantity",
        "An expression. Python calculates it before assigning the result.",
      ],
      ["total", "A variable holding the calculated value, 36."],
    ],
    task: "You buy 4 notebooks for 6 coins each and get a discount of 5 coins. Store the final cost in a variable called total and print it. Calculate the value using operators, rather than typing the answer.",
    starter:
      "price = 6\nquantity = 4\ndiscount = 5\n\n# Calculate and print total.\n",
    tests: [
      { label: "Correct final cost", expected: "19" },
      {
        label: "Store the calculated total",
        expression: "total == price * quantity - discount",
        hidden: true,
      },
      {
        label: "Calculate with operators",
        expression:
          'any(isinstance(node, __import__("ast").BinOp) for node in __import__("ast").walk(__import__("ast").parse(__forge_source__)))',
      },
    ],
    hints: [
      "Multiply the price by quantity first.",
      "The discount should be subtracted from the full cost.",
      "Assign the expression to total before printing.",
      "total = price times quantity minus discount",
    ],
    solution:
      "price = 6\nquantity = 4\ndiscount = 5\ntotal = price * quantity - discount\nprint(total)",
    explain:
      "The multiplication happens first: 6 × 4 gives 24. Then 5 is subtracted, leaving 19. Storing that result makes it reusable.",
    predict: {
      code: "print(2 + 3 * 4)",
      answer: "14",
      options: ["20", "14", "24"],
    },
  },
  {
    id: "conditions",
    title: "Teach your code to choose",
    concept: "Booleans & conditionals",
    short: "Make decisions with if and else.",
    duration: 15,
    xp: 100,
    language: "python",
    file: "decisions.py",
    description:
      "Useful programs make choices based on the information they have.",
    paragraph:
      "An if statement checks a condition. A condition evaluates to True or False. A colon starts the block of code to run if the condition is true. Indentation—four spaces—is how Python groups that block. else handles the other case.",
    example:
      'temperature = 25\nif temperature > 20:\n    print("Warm")\nelse:\n    print("Cool")',
    symbols: [
      ["if", "Run the next indented block only when the condition is True."],
      [">", "Greater than. >= means greater than or equal to."],
      [":", "Starts an indented block."],
      ["else", "Run this block when the if condition is False."],
    ],
    task: 'Write a function called access(age) that returns "Welcome" when age is 18 or higher, and "Not yet" otherwise. The function shell is already provided. Replace pass with your condition.',
    starter:
      "def access(age):\n    # Replace pass with your decision.\n    pass\n\nprint(access(18))\n",
    tests: [
      { label: "An adult can enter", expression: 'access(25) == "Welcome"' },
      { label: "A child must wait", expression: 'access(12) == "Not yet"' },
      {
        label: "The exact boundary works",
        expression: 'access(18) == "Welcome"',
        hidden: true,
      },
    ],
    hints: [
      "The function shell takes age as input. return sends a value back.",
      "Compare age to 18 using >=.",
      "Use if for the adult case and else for the other case.",
      "if age >= 18: return the welcome string; otherwise return the other string.",
    ],
    solution:
      'def access(age):\n    if age >= 18:\n        return "Welcome"\n    else:\n        return "Not yet"\n\nprint(access(18))',
    explain:
      "The boundary is inclusive: 18 counts as an adult. return gives a value back to whoever called the function, unlike print which only displays it.",
    predict: {
      code: 'score = 10\nif score >= 10:\n    print("Ready")\nelse:\n    print("Wait")',
      answer: "Ready",
      options: ["Wait", "Ready", "True"],
    },
  },
  {
    id: "functions",
    title: "Build your first function",
    concept: "Functions & return values",
    short: "Write an instruction you can reuse.",
    duration: 15,
    xp: 100,
    language: "python",
    file: "greetings.py",
    description:
      "A function is a named set of instructions you can run again with different inputs.",
    paragraph:
      "def defines a function. A parameter is a name for the input it receives. The function body is indented. return sends a result back to the code that called it. Defining a function does not run it—you must call it with parentheses.",
    example: "def double(number):\n    return number * 2\n\nprint(double(4))",
    symbols: [
      ["def", "The keyword for defining a function."],
      ["double", "Your chosen function name."],
      ["number", "A parameter: the local name for the input."],
      ["return", "Sends a result back and ends this function call."],
    ],
    task: 'Write a function called greet with a parameter called name. It should return "Hello, " followed by the name and "!". For example, greet("Ada") returns "Hello, Ada!".',
    starter:
      '# Define your greet function here.\n\n\n# Try it when you are ready.\n# print(greet("Ada"))\n',
    tests: [
      { label: "Greet Ada", expression: 'greet("Ada") == "Hello, Ada!"' },
      {
        label: "Greet a different person",
        expression: 'greet("Sam") == "Hello, Sam!"',
      },
      {
        label: "Handle an empty name",
        expression: 'greet("") == "Hello, !"',
        hidden: true,
      },
    ],
    hints: [
      "Join strings using the + operator.",
      "Your function should return the greeting, not just print it.",
      "Join three parts: the greeting prefix, the name parameter, and the exclamation mark.",
      "def greet(name): followed by an indented return of the joined strings.",
    ],
    solution:
      'def greet(name):\n    return "Hello, " + name + "!"\n\nprint(greet("Ada"))',
    explain:
      "name changes for every call. The string concatenation builds a fresh greeting, and return makes it available to the caller.",
    predict: {
      code: "def add(a, b):\n    return a + b\nprint(add(2, 3))",
      answer: "5",
      options: ["23", "5", "a + b"],
    },
  },
  {
    id: "loops",
    title: "Do more with a loop",
    concept: "Loops & lists",
    short: "Repeat instructions without repeating code.",
    duration: 15,
    xp: 125,
    language: "python",
    file: "loops.py",
    description:
      "A loop follows the same instructions for each item in a collection.",
    paragraph:
      "A list holds multiple values between square brackets, separated by commas. A for loop takes one item at a time. Its indented body runs once for every item. An accumulator is a variable you update each time to build a result.",
    example:
      "scores = [2, 4, 6]\ntotal = 0\nfor score in scores:\n    total = total + score\nprint(total)",
    symbols: [
      ["[2, 4, 6]", "A list of three integers."],
      ["for", "Begins a loop."],
      ["in", "Takes items from the list one by one."],
      ["total + score", "Adds this item to the running total."],
    ],
    task: "Write a function called sum_scores(scores) that returns the sum of all numbers in a list. Use a for loop and an accumulator. An empty list should return 0.",
    starter:
      "def sum_scores(scores):\n    # Start your total, loop, then return.\n    pass\n",
    tests: [
      { label: "Add three scores", expression: "sum_scores([2, 4, 6]) == 12" },
      { label: "An empty list", expression: "sum_scores([]) == 0" },
      {
        label: "Negative numbers",
        expression: "sum_scores([-5, 3, 8]) == 6",
        hidden: true,
      },
      {
        label: "Use a for loop",
        expression:
          'any(isinstance(node, __import__("ast").For) for node in __import__("ast").walk(__import__("ast").parse(__forge_source__)))',
      },
    ],
    hints: [
      "Start your total at zero before the loop.",
      "Update the total inside the loop.",
      "Return after the loop finishes, not inside it.",
      "total = 0; for each score, add it to total; finally return total.",
    ],
    solution:
      "def sum_scores(scores):\n    total = 0\n    for score in scores:\n        total = total + score\n    return total",
    explain:
      "The accumulator begins at zero so an empty list also works. The return is outside the loop: every item is included before the function ends.",
    predict: {
      code: "for n in [1, 2]:\n    print(n * 2)",
      answer: "2\n4",
      options: ["1\n2", "2\n4", "6"],
    },
  },
];
lessons.push(...pythonNext);
// Functions precede conditional exercises: prerequisites are deliberate, not cosmetic.
export const lessonOrder = [
  "first-line",
  "variables",
  "numbers",
  "functions",
  "conditions",
  "loops",
  ...pythonNext.map((lesson) => lesson.id),
];
export const pythonLessons = lessonOrder.map((id) =>
  lessons.find((l) => l.id === id),
);
export const courses = [
  {
    id: "python",
    name: "Python foundations",
    language: "python",
    icon: "python",
    chapter: 1,
    lessons: pythonLessons,
  },
  {
    id: "javascript",
    name: "JavaScript foundations",
    language: "javascript",
    icon: "js",
    chapter: 4,
    lessons: javascriptLessons,
  },
];
// Each course is an independent beginner track. Inside a track, prerequisites
// are explicit so adding another language cannot accidentally unlock its lessons.
for (const course of courses)
  course.lessons.forEach((lesson, index) => {
    lesson.courseId = course.id;
    lesson.requires = index ? [course.lessons[index - 1].id] : [];
  });
lessons.push(...javascriptLessons);
lessonOrder.push(...javascriptLessons.map((l) => l.id));
export const orderedLessons = courses.flatMap((course) => course.lessons);
export function courseForLesson(lesson) {
  return (
    courses.find((c) => c.id === lesson.courseId) ||
    courses.find((c) => c.language === lesson.language) ||
    courses[0]
  );
}
export function lessonsForCourse(id) {
  return courses.find((c) => c.id === id)?.lessons || [];
}
export function prerequisitesFor(lesson) {
  return lesson.requires || [];
}
export function canStartLesson(state, lesson) {
  return prerequisitesFor(lesson).every((id) => state.completed.includes(id));
}
export function nextLessonFor(state) {
  const preferred = lessonsForCourse(state.activeCourse || "python");
  return (
    [
      ...preferred,
      ...orderedLessons.filter((l) => !preferred.includes(l)),
    ].find(
      (l) => !state.completed.includes(l.id) && canStartLesson(state, l),
    ) || null
  );
}
export function courseProgress(state, id) {
  const available = lessonsForCourse(id);
  const completed = available.filter((l) =>
    state.completed.includes(l.id),
  ).length;
  return {
    completed,
    total: available.length,
    percent: available.length ? (completed / available.length) * 100 : 0,
  };
}

export const challenges = [
  { ...javascriptChallenge, courseId: "javascript" },
  inventoryBoss,
  {
    ...lessons[4],
    id: "friendly-bot",
    title: "The friendly robot",
    concept: "Strings · Functions",
    difficulty: "Beginner",
    requires: ["functions"],
    xp: 100,
    description:
      "A little robot at the academy entrance needs help greeting its visitors.",
    task: 'Implement greet(name). Return "Hello, " followed by the visitor’s name and an exclamation mark. Do not print the greeting inside the function.',
    constraints: [
      "name is a string of 0–100 characters.",
      "Preserve capitalization and spaces.",
    ],
    examples: [
      ['greet("Ada")', '"Hello, Ada!"'],
      ['greet("Lin")', '"Hello, Lin!"'],
    ],
    complexity:
      "O(n) time and O(n) space, where n is the length of the name: a new greeting string is created.",
  },
  {
    ...lessons[5],
    id: "trail-total",
    title: "The trail counter",
    concept: "Lists · Loops",
    difficulty: "Easy",
    requires: ["loops"],
    xp: 150,
    description:
      "Your hiking app records the distance of each section. Find the total distance.",
    task: "Implement sum_scores(scores) to return the sum of the integer distances. The list may be empty and corrections may be negative.",
    constraints: [
      "0 ≤ number of values ≤ 1,000",
      "Each value is between -10,000 and 10,000.",
    ],
    examples: [
      ["[2, 4, 6]", "12"],
      ["[]", "0"],
    ],
    complexity:
      "O(n) time to visit n values, and O(1) extra space for the accumulator.",
  },
  {
    id: "signal-window",
    title: "A quiet signal",
    concept: "Sliding window · Hash maps",
    difficulty: "Medium",
    requires: ["future"],
    xp: 250,
    description: "Find the longest stretch of unique signals in a message.",
    planned: true,
  },
  {
    id: "route-finder",
    title: "The island courier",
    concept: "Graphs · BFS",
    difficulty: "Hard",
    requires: ["future"],
    xp: 400,
    description: "Find the shortest delivery route between connected islands.",
    planned: true,
  },
  {
    id: "power-grid",
    title: "Restore the power grid",
    concept: "Graphs · Dynamic programming",
    difficulty: "Expert",
    requires: ["future"],
    xp: 600,
    description:
      "Design an efficient recovery plan for a network of power stations.",
    planned: true,
  },
];
export const paths = [
  {
    name: "Python foundations",
    courseId: "python",
    sub: "Your first line to your first program",
    tag: "START HERE",
    icon: "python",
    lessons: pythonLessons.length,
    time: "3 hours",
    color: "blue",
    available: true,
    topics: [
      "How code executes",
      "Output & strings",
      "Variables & data types",
      "Numbers & operators",
      "Functions & parameters",
      "Conditionals",
      "Loops & lists",
      ...pythonNext.map((l) => l.concept),
    ],
  },
  {
    name: "Git & the terminal",
    sub: "Take control of your developer tools",
    icon: "terminal",
    lessons: 12,
    time: "4 hours",
    color: "mint",
    topics: [
      "Command line",
      "Bash & PowerShell",
      "Git commits & branches",
      "GitHub & pull requests",
      "Merge conflicts",
      "Environment variables",
    ],
  },
  {
    name: "HTML & CSS",
    sub: "Make your corner of the internet",
    icon: "html",
    lessons: 24,
    time: "8 hours",
    color: "orange",
    topics: [
      "Semantic HTML",
      "Forms & accessibility",
      "Box model",
      "Flexbox & Grid",
      "Responsive design",
      "Animations",
    ],
  },
  {
    name: "JavaScript foundations",
    courseId: "javascript",
    sub: "From your first log to real async code",
    icon: "js",
    lessons: javascriptLessons.length,
    time: "2.5 hours",
    color: "yellow",
    available: true,
    topics: javascriptLessons.map((l) =>
      l.concept.replace("JavaScript · ", ""),
    ),
  },
  {
    name: "TypeScript & React",
    sub: "Build interfaces that scale",
    icon: "react",
    lessons: 36,
    time: "16 hours",
    color: "purple",
    topics: [
      "Types & interfaces",
      "Generics",
      "JSX & components",
      "Props & state",
      "Hooks",
      "Routing & forms",
      "Next.js",
    ],
  },
  {
    name: "SQL & databases",
    sub: "Give your applications a memory",
    icon: "database",
    lessons: 20,
    time: "8 hours",
    color: "mint",
    topics: [
      "SQL & CRUD",
      "PostgreSQL",
      "Relationships & joins",
      "Indexes & transactions",
      "Migrations",
      "Supabase & RLS",
      "Redis",
    ],
  },
  {
    name: "Backend & APIs",
    sub: "Build the engine behind your app",
    icon: "server",
    lessons: 28,
    time: "14 hours",
    color: "blue",
    topics: [
      "HTTP & REST",
      "Node & Express",
      "FastAPI",
      "Authentication & OAuth",
      "Validation",
      "Background jobs",
      "Webhooks",
    ],
  },
  {
    name: "Full-stack development",
    sub: "Connect every piece of the puzzle",
    icon: "layers",
    lessons: 24,
    time: "18 hours",
    color: "purple",
    topics: [
      "Frontend to backend",
      "Role-based permissions",
      "CRUD & search",
      "Realtime updates",
      "Multi-tenant SaaS",
      "Payments & billing",
    ],
  },
  {
    name: "Security & testing",
    sub: "Build software people can trust",
    icon: "shield",
    lessons: 20,
    time: "10 hours",
    color: "orange",
    topics: [
      "OWASP",
      "XSS & CSRF",
      "SQL injection",
      "Secrets",
      "Unit & integration tests",
      "Playwright",
      "Debuggers",
      "Code reviews",
    ],
  },
  {
    name: "Cloud & deployment",
    sub: "Ship it to the real world",
    icon: "cloud",
    lessons: 18,
    time: "10 hours",
    color: "blue",
    topics: [
      "DNS & TLS",
      "Linux",
      "Docker & Compose",
      "CI/CD",
      "Monitoring",
      "Backups & rollbacks",
    ],
  },
  {
    name: "Desktop & mobile",
    sub: "Go beyond the browser",
    icon: "phone",
    lessons: 30,
    time: "20 hours",
    color: "mint",
    topics: [
      "Tauri & Rust",
      "Electron",
      "Native APIs",
      "Installers & signing",
      "React Native & Expo",
      "Offline sync",
      "App stores",
    ],
  },
  {
    name: "AI engineering",
    sub: "Build your own intelligent tools",
    icon: "sparkles",
    lessons: 26,
    time: "16 hours",
    color: "purple",
    topics: [
      "LLMs & APIs",
      "Structured outputs",
      "Tools & agents",
      "RAG & embeddings",
      "Vector databases",
      "Evaluations",
      "Prompt-injection defense",
      "Voice AI",
    ],
  },
  {
    name: "Computer science & algorithms",
    sub: "Understand what happens underneath",
    icon: "cpu",
    lessons: 40,
    time: "24 hours",
    color: "yellow",
    topics: [
      "Bits & memory",
      "Processes & threads",
      "Networking",
      "Big O",
      "Arrays & hash maps",
      "Trees & graphs",
      "BFS & DFS",
      "Dynamic programming",
    ],
  },
  {
    name: "Design & software engineering",
    sub: "Turn good code into great products",
    icon: "layout",
    lessons: 24,
    time: "12 hours",
    color: "orange",
    topics: [
      "UI/UX & typography",
      "Accessibility",
      "Design systems",
      "Architecture",
      "SOLID",
      "Refactoring",
      "Documentation",
      "Product design",
    ],
  },
  {
    name: "Advanced systems",
    sub: "Choose your next specialization",
    icon: "network",
    lessons: 40,
    time: "30 hours",
    color: "purple",
    topics: [
      "Rust / Go / C / C++",
      "WebSockets & GraphQL",
      "Distributed systems",
      "Message queues",
      "Kubernetes & IaC",
      "WebAssembly",
      "Machine learning",
      "System design",
    ],
  },
];
export const projects = [
  {
    id: "portfolio",
    title: "Your personal corner of the web",
    type: "Personal portfolio",
    description:
      "An introduction, a little personality, and a place to show what you build.",
    language: "html",
    level: "Beginner",
    time: "30–45 min",
    color: "blue",
    available: true,
    requires: [],
    files: {
      "index.html":
        '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My first website</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main>\n    <p class="eyebrow">HELLO, WORLD</p>\n    <h1>I am a developer in the making.</h1>\n    <p>This is my first little corner of the internet.</p>\n    <!-- Add your name, interests, and a project below. -->\n    <button onclick="sayHello()">Say hello</button>\n    <p id="greeting"></p>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>',
      "style.css":
        "body {\n  margin: 0;\n  background: #10192a;\n  color: #e8edf7;\n  font-family: system-ui, sans-serif;\n}\nmain { max-width: 640px; margin: 12vh auto; padding: 32px; }\n.eyebrow { color: #79a6ff; letter-spacing: 3px; font-size: 12px; }\nh1 { font-size: 48px; line-height: 1.1; }\np { line-height: 1.7; color: #a9b8d0; }\nbutton { background: #3979f6; color: white; border: 0; border-radius: 8px; padding: 14px 20px; cursor: pointer; }",
      "script.js":
        'function sayHello() {\n  document.getElementById("greeting").textContent = "You made this happen. Keep building!";\n}',
    },
  },
  {
    id: "calculator",
    title: "Make every number count",
    type: "Python calculator",
    description:
      "Turn your knowledge of functions and operators into a useful calculator.",
    language: "python",
    level: "Beginner",
    time: "20–30 min",
    color: "mint",
    available: true,
    requires: ["functions"],
    files: {
      "main.py":
        '# Build a calculator with four functions:\n# add(a, b), subtract(a, b), multiply(a, b), divide(a, b).\n# For division by zero, return "Cannot divide by zero".\n# Start with add. Then test each function with print().\n\ndef add(a, b):\n    pass\n\nprint(add(3, 5))\n',
    },
  },
  {
    id: "todo",
    title: "A little less on your mind",
    type: "Task manager",
    description:
      "Create, check off, and organize everyday tasks with JavaScript.",
    level: "Intermediate",
    time: "2–3 hours",
    color: "purple",
    requires: ["future"],
  },
  {
    id: "saas",
    title: "Your idea, in the real world",
    type: "Full-stack SaaS",
    description:
      "Authentication, a database, and a dashboard. All built by you.",
    level: "Advanced",
    time: "12–16 hours",
    color: "orange",
    requires: ["future"],
  },
];
export const badges = [
  {
    id: "javascript-foundation",
    name: "Speaking JavaScript",
    desc: `Complete all ${javascriptLessons.length} JavaScript lessons.`,
    icon: "braces",
    need: javascriptLessons.length,
    courseId: "javascript",
  },
  {
    id: "python-data",
    name: "Data fluent",
    desc: `Complete all ${pythonLessons.length} Python lessons.`,
    icon: "database",
    need: pythonLessons.length,
    courseId: "python",
  },
  {
    id: "supply-station",
    name: "Ready to build",
    desc: "Pass the supply station boss battle.",
    icon: "swords",
    need: 1,
  },
  {
    id: "first-code",
    name: "Hello, world",
    desc: "Pass your first coding exercise.",
    icon: "terminal",
    need: 1,
  },
  {
    id: "three-lessons",
    name: "Finding your flow",
    desc: "Complete three lessons.",
    icon: "flame",
    need: 3,
  },
  {
    id: "python-foundation",
    name: "Foundation builder",
    desc: "Complete the first six Python lessons.",
    courseId: "python",
    icon: "gem",
    need: 6,
  },
  {
    id: "first-challenge",
    name: "Problem solver",
    desc: "Solve your first original challenge.",
    icon: "swords",
    need: 1,
  },
  {
    id: "independent",
    name: "On your own",
    desc: "Pass an exam without hints.",
    icon: "shield",
    need: 1,
  },
];
