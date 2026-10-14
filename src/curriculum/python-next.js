// Every lesson ships with an independent task, executable tests, and explicit syntax teaching.
export const pythonNext = [
  {
    id: "string-tools",
    title: "Make messy text useful",
    concept: "String methods",
    short: "Clean and normalize text without changing the original.",
    duration: 14,
    xp: 125,
    language: "python",
    file: "text_tools.py",
    description:
      "People type extra spaces and unexpected capitals. Your code can turn that messy input into something predictable.",
    paragraph:
      "A method is a function attached to a value. Write a dot after a string to call one of its methods. strip() removes whitespace at the two ends; lower() returns a lowercase version. Strings are immutable: these methods return new strings rather than editing the original. You can chain calls because the first result is another string. len(text) counts characters. Square brackets select one character using a zero-based index: text[0] is the first character, but fails for an empty string.",
    example:
      'title = "  Hello Python  "\nclean = title.strip().lower()\nprint(clean)\nprint(len(clean))',
    symbols: [
      [".", "Access a method on the value immediately before the dot."],
      [
        "strip()",
        "Return a new string with surrounding whitespace removed. Spaces in the middle stay.",
      ],
      ["lower()", "Return a lowercase copy; the parentheses call the method."],
      [
        "len(clean)",
        "Pass the cleaned string to the built-in length function.",
      ],
      [
        "text[0]",
        "Read the character at index zero. Check for an empty string first.",
      ],
    ],
    task: 'Define normalize_tag(text). Return the text with surrounding whitespace removed and letters converted to lowercase. Preserve spaces in the middle. For example, "  Python Club  " becomes "python club". Return the string; do not print inside the function.',
    starter:
      "def normalize_tag(text):\n    # Clean the ends, then normalize the letters.\n    pass\n\n# Try a value after defining your function.\n",
    tests: [
      {
        label: "Clean a mixed-case tag",
        expression: 'normalize_tag("  Python Club  ") == "python club"',
      },
      {
        label: "Leave internal spaces intact",
        expression: 'normalize_tag("A  B") == "a  b"',
      },
      {
        label: "Empty and whitespace-only inputs",
        expression:
          'normalize_tag("") == "" and normalize_tag(" \\t\\n ") == ""',
        hidden: true,
      },
      {
        label: "Already normalized input",
        expression: 'normalize_tag("hello") == "hello"',
        hidden: true,
      },
    ],
    hints: [
      "Both operations you need are string methods. They return strings.",
      "Work on text, not on a hard-coded example value.",
      "First strip surrounding whitespace. Lowercase that returned string.",
      "Return text dot strip call, followed by dot lower call.",
    ],
    solution:
      'def normalize_tag(text):\n    return text.strip().lower()\n\nprint(normalize_tag("  Python Club  "))',
    explain:
      "strip() handles spaces, tabs, and newlines at the ends. lower() normalizes the letters. Neither operation changes the original string, and both safely handle an empty string.",
    predict: {
      code: 'word = "  CODE  "\nword.strip()\nprint(len(word))',
      answer: "8",
      options: ["4", "8", "6"],
    },
    debugStarter:
      'def normalize_tag(text):\n    text.strip()\n    return text.lower()\n\nprint(normalize_tag("  Python Club  "))',
    debugTask:
      "The code lowercases correctly, but keeps unwanted spaces. The strip() call runs—why does it not change text? Fix the function without hard-coding the example.",
  },
  {
    id: "dictionaries",
    title: "Give your data some structure",
    concept: "Dictionaries & records",
    short: "Group related values under meaningful names.",
    duration: 17,
    xp: 150,
    language: "python",
    file: "records.py",
    description:
      "A product is more than one number. A dictionary keeps its name, price, and quantity together.",
    paragraph:
      'A dictionary maps unique keys to values. Curly braces create it, a colon connects each key to its value, and commas separate pairs. Keys are often strings; values can be numbers, strings, lists, or other dictionaries. record["key"] looks up a value and raises KeyError if the key is missing. record.get("key", default) returns the default when it is absent. Assigning record["key"] = value adds or changes a pair. A list of dictionaries represents several records, which you can visit with a for loop.',
    example:
      'item = {"name": "Notebook", "price": 6}\nprint(item["name"])\nprint(item.get("quantity", 1))\nitem["quantity"] = 4',
    symbols: [
      ["{ }", "Enclose a dictionary, not a list. An empty dictionary is {}."],
      ['"price": 6', 'The key "price" maps to the integer value 6.'],
      ['item["name"]', 'Look up the value stored under the exact key "name".'],
      [
        '.get("quantity", 1)',
        "Look up quantity, using 1 only when the key is absent. A stored 0 stays 0.",
      ],
      [
        'item["quantity"] = 4',
        "Add or replace the quantity value in this dictionary.",
      ],
    ],
    task: "Define line_total(item). The dictionary has a numeric price and may have a quantity. Return price multiplied by quantity, using 1 if quantity is absent. A quantity of 0 must return 0. Do not change the original dictionary.",
    starter:
      'def line_total(item):\n    # Read the price and choose a default quantity.\n    pass\n\n# print(line_total({"price": 6, "quantity": 4}))\n',
    tests: [
      {
        label: "Multiply price by quantity",
        expression: 'line_total({"price": 6, "quantity": 4}) == 24',
      },
      {
        label: "Default a missing quantity to one",
        expression: 'line_total({"price": 7}) == 7',
      },
      {
        label: "Respect a zero quantity",
        expression: 'line_total({"price": 9, "quantity": 0}) == 0',
        hidden: true,
      },
      {
        label: "Do not mutate the record",
        expression:
          '(lambda item: (line_total(item), item) == (5, {"price": 5}))({"price": 5})',
        hidden: true,
      },
    ],
    hints: [
      "Read the two values from the dictionary before multiplying them.",
      "Use brackets for the required price, and get() for the optional quantity.",
      "A missing key and a value of zero are different. get() preserves zero.",
      'price = item["price"]; quantity = item.get("quantity", default); return their product.',
    ],
    solution:
      'def line_total(item):\n    price = item["price"]\n    quantity = item.get("quantity", 1)\n    return price * quantity',
    explain:
      "get() returns the default only when the key is absent. That is why a quantity of zero works. Reading values and multiplying them leaves the original record unchanged.",
    predict: {
      code: 'item = {"quantity": 0}\nprint(item.get("quantity", 1))',
      answer: "0",
      options: ["1", "0", "KeyError"],
    },
    debugStarter:
      'def line_total(item):\n    quantity = item.get("quantity", 1)\n    if quantity == 0:\n        quantity = 1\n    return item["price"] * quantity\n\nprint(line_total({"price": 9, "quantity": 0}))',
    debugTask:
      "Most orders work, but an order containing zero units costs money. Find the branch that changes a valid zero into something else.",
  },
  {
    id: "json",
    title: "Speak the language of APIs",
    concept: "JSON & imports",
    short: "Turn structured text into Python data—and back.",
    duration: 18,
    xp: 150,
    language: "python",
    file: "json_data.py",
    description:
      "Websites, apps, and AI tools often exchange JSON. It is data written as text, not a programming language.",
    paragraph:
      "A module is a reusable collection of code. import json loads Python’s built-in JSON module, so you do not need pip. json.loads(text) parses a JSON string into Python values: JSON objects become dictionaries and arrays become lists. json.dumps(value) serializes Python data into JSON text. JSON requires double quotes around keys and strings. JSON true, false, and null become Python True, False, and None. None means there is no value. A Python dictionary is an in-memory object, not itself a JSON string. Invalid JSON raises an error; the next lesson teaches how to handle it.",
    example:
      'import json\n\ntext = \'{"name": "Ada", "active": true}\'\nprofile = json.loads(text)\nprint(profile["name"])\nprint(json.dumps(profile))',
    symbols: [
      ["import json", "Load the standard-library module and bind its name."],
      [
        "json.loads(text)",
        "Load from a string. The s means string, not a filename.",
      ],
      [
        "json.dumps(profile)",
        "Dump to a string. This returns JSON text; it does not save a file.",
      ],
      [
        "'…'",
        "Python single quotes can surround JSON text that contains double quotes.",
      ],
      [
        "true → True",
        "The parser converts JSON literal values into their Python counterparts.",
      ],
    ],
    task: "Write enabled_names(text). Parse a valid JSON string containing a list of records. Return a Python list of the name values whose enabled value is true. Missing enabled means false. Preserve record order. Each record has a name. Use a loop and append(): names.append(value) adds one value to the end of a list.",
    starter:
      "import json\n\ndef enabled_names(text):\n    # Parse, create an empty list, loop, then return it.\n    pass\n",
    tests: [
      {
        label: "Select enabled names in order",
        expression:
          'enabled_names(\'[ {"name":"Ada","enabled":true}, {"name":"Lin","enabled":false}, {"name":"Sam","enabled":true} ]\') == ["Ada", "Sam"]',
      },
      {
        label: "Handle an empty JSON array",
        expression: 'enabled_names("[]") == []',
      },
      {
        label: "Default missing flags to false",
        expression:
          'enabled_names(\'[{"name":"Ada"},{"name":"Sam","enabled":true}]\') == ["Sam"]',
        hidden: true,
      },
      {
        label: "Return Python data, not JSON text",
        expression: 'type(enabled_names("[]")) is list',
        hidden: true,
      },
    ],
    hints: [
      "json.loads turns the input text into a list you can loop through.",
      'Start names = [] outside the loop. For each record, check .get("enabled", False).',
      'Inside the if block, names.append(record["name"]) adds one selected name.',
      "Parse records; make an empty names list; for each enabled record, append its name; return names after the loop.",
    ],
    solution:
      'import json\n\ndef enabled_names(text):\n    records = json.loads(text)\n    names = []\n    for record in records:\n        if record.get("enabled", False):\n            names.append(record["name"])\n    return names',
    explain:
      "The parser converts true and false into Python booleans. The if statement uses those values directly. Appending only inside the if preserves the order of enabled records. Returning after the loop includes every match.",
    predict: {
      code: 'import json\nrecord = json.loads(\'{"ready": false, "value": null}\')\nprint(record["ready"])\nprint(record["value"])',
      answer: "False\nNone",
      options: ["false\nnull", "False\nNone", '"False"\n"None"'],
    },
    debugStarter:
      'import json\n\ndef enabled_names(text):\n    records = json.loads(text)\n    names = []\n    for record in records:\n        if record.get("enabled", False):\n            names.append(record["name"])\n        return names\n\nprint(enabled_names(\'[{"name":"Ada","enabled":true},{"name":"Sam","enabled":true}]\'))',
    debugTask:
      "The function stops after looking at the first record, and an empty list returns None. Trace the return statement and fix its indentation.",
  },
  {
    id: "error-handling",
    title: "Make failure part of the plan",
    concept: "Exceptions & validation",
    short: "Handle bad input without hiding genuine bugs.",
    duration: 18,
    xp: 175,
    language: "python",
    file: "safe_input.py",
    description:
      "Errors are information. Good software knows which ones to handle and which ones to surface.",
    paragraph:
      "An exception interrupts normal execution. Put an operation that might fail in a try block. except ValueError handles a value-conversion error from int(text), which tries to turn text into an integer. If parsing succeeds, the except block is skipped. If it fails, Python jumps to that block. Catch the specific exception you expect, not everything: otherwise real bugs get hidden. A return inside either block ends the function. A parsed value can still be invalid for your application, so check boundaries after conversion. For example, negative stock is a valid integer but an invalid inventory count.",
    example:
      'def parse_age(text):\n    try:\n        age = int(text)\n    except ValueError:\n        return None\n    if age < 0:\n        return None\n    return age\n\nprint(parse_age("twelve"))',
    symbols: [
      ["try:", "Attempt the following indented block."],
      [
        "int(text)",
        'Convert integer-looking text, such as "12", into a whole number.',
      ],
      [
        "except ValueError:",
        "Handle this specific kind of exception if conversion fails.",
      ],
      [
        "None",
        'A sentinel representing no valid result, not the string "None".',
      ],
      ["age < 0", "A separate validity check after successful conversion."],
    ],
    task: "Define parse_quantity(text). The input is always a string. Return its integer value if it is between 0 and 99 inclusive. Return None for non-integer text or out-of-range values. Spaces around a valid integer are accepted by int(). Use try / except ValueError instead of raising a parsing error to the caller.",
    starter:
      "def parse_quantity(text):\n    # Convert safely, validate the range, then return.\n    pass\n",
    tests: [
      {
        label: "Parse valid integer text",
        expression: 'parse_quantity(" 12 ") == 12',
      },
      {
        label: "Handle invalid text",
        expression:
          'parse_quantity("many") is None and parse_quantity("3.5") is None',
      },
      {
        label: "Include both boundaries",
        expression: 'parse_quantity("0") == 0 and parse_quantity("99") == 99',
        hidden: true,
      },
      {
        label: "Reject out-of-range values and empty input",
        expression:
          'parse_quantity("-1") is None and parse_quantity("100") is None and parse_quantity("") is None',
        hidden: true,
      },
      {
        label: "Practice specific exception handling",
        expression:
          'any(isinstance(n, __import__("ast").ExceptHandler) and isinstance(n.type, __import__("ast").Name) and n.type.id == "ValueError" for n in __import__("ast").walk(__import__("ast").parse(__forge_source__)))',
      },
    ],
    hints: [
      "Convert inside try, because conversion can fail before your range check runs.",
      "except ValueError should return None. Do not put quotation marks around None.",
      "After successful conversion, check the lower and upper boundaries. Two if statements are fine.",
      "try to parse; on ValueError return None; reject below 0; reject above 99; otherwise return the parsed quantity.",
    ],
    solution:
      "def parse_quantity(text):\n    try:\n        quantity = int(text)\n    except ValueError:\n        return None\n    if quantity < 0:\n        return None\n    if quantity > 99:\n        return None\n    return quantity",
    explain:
      "Conversion and validation are separate. int() either returns an integer or raises ValueError for these string inputs. The range checks reject valid integers that do not fit our application. None communicates failure without confusing it with the valid quantity zero.",
    predict: {
      code: 'try:\n    value = int("three")\n    print("Converted")\nexcept ValueError:\n    print("Try again")',
      answer: "Try again",
      options: ["Converted", "Try again", "Converted\nTry again"],
    },
    debugStarter:
      'def parse_quantity(text):\n    quantity = int(text)\n    try:\n        if quantity < 0:\n            return None\n        if quantity > 99:\n            return None\n        return quantity\n    except ValueError:\n        return None\n\nprint(parse_quantity("many"))',
    debugTask:
      "This code contains a try block, but invalid text still crashes. Which operation can raise ValueError, and is that operation actually inside the protected block?",
  },
];

export const inventoryBoss = {
  id: "inventory-boss",
  title: "Boss battle: the supply station",
  concept: "JSON · Validation · Aggregation",
  short: "Combine your foundations into one useful program.",
  difficulty: "Easy",
  boss: true,
  xp: 300,
  requires: ["error-handling"],
  duration: 30,
  language: "python",
  file: "supply_station.py",
  description:
    "The academy supply station receives stock updates as JSON. Build a small, reliable piece of its inventory system from a blank function.",
  paragraph:
    'This is a synthesis challenge: no new syntax is needed. Parse the JSON text, iterate over the records, convert each quantity string safely, and accumulate valid values in a dictionary. Duplicate item names must have their quantities added together. Missing quantity defaults to "0". The JSON structure and item names are valid; only quantity text can be invalid. Separate parsing, validation, and accumulation in your plan before writing code.',
  example:
    'stock = {"notebook": 2}\nstock["notebook"] = stock.get("notebook", 0) + 3\nprint(stock)',
  symbols: [
    [
      "json.loads(text)",
      "Convert the incoming JSON array text into a list of records.",
    ],
    [
      'record.get("quantity", "0")',
      "Read a quantity string, or use a default zero string.",
    ],
    [
      "try / except ValueError",
      "Treat a malformed quantity as zero rather than crashing.",
    ],
    [
      "stock.get(name, 0)",
      "Read the running total for an item name, defaulting to zero.",
    ],
  ],
  task: "Implement inventory_totals(text). Input is a valid JSON array of objects with a non-empty name string and an optional quantity string. Convert each quantity with int(). Missing, invalid, or negative quantities contribute 0. Add quantities for repeated names. Return a Python dictionary containing every name that appeared, even if its total is 0. Do not lowercase names: they are case-sensitive. Plan your solution first; use only the tools you have learned.",
  starter:
    "import json\n\ndef inventory_totals(text):\n    # Plan: parse -> validate each record -> accumulate -> return\n    pass\n",
  constraints: [
    "0–200 records; name is a non-empty string.",
    "quantity, when present, is a string of at most 20 characters.",
    "Input is valid JSON; names and the record structure are guaranteed valid.",
    "Names are case-sensitive; missing, non-integer, or negative quantities contribute zero.",
  ],
  examples: [
    [
      '[{"name":"pen","quantity":"3"},{"name":"pen","quantity":"2"}]',
      '{"pen": 5}',
    ],
    [
      '[{"name":"book","quantity":"many"},{"name":"clip"}]',
      '{"book": 0, "clip": 0}',
    ],
  ],
  tests: [
    {
      label: "Combine repeat item names",
      expression:
        'inventory_totals(\'[{"name":"pen","quantity":"3"},{"name":"pen","quantity":"2"}]\') == {"pen":5}',
    },
    {
      label: "Keep invalid and missing items with zero totals",
      expression:
        'inventory_totals(\'[{"name":"book","quantity":"many"},{"name":"clip"}]\') == {"book":0,"clip":0}',
    },
    {
      label: "An empty delivery",
      expression: 'inventory_totals("[]") == {}',
      hidden: true,
    },
    {
      label: "Do not subtract negative quantities",
      expression:
        'inventory_totals(\'[{"name":"pen","quantity":"4"},{"name":"pen","quantity":"-9"}]\') == {"pen":4}',
      hidden: true,
    },
    {
      label: "Handle spaces, zero, and decimal text",
      expression:
        'inventory_totals(\'[{"name":"a","quantity":" 7 "},{"name":"b","quantity":"0"},{"name":"c","quantity":"2.5"}]\') == {"a":7,"b":0,"c":0}',
      hidden: true,
    },
    {
      label: "Keep names distinct and return a dictionary",
      expression:
        'inventory_totals(\'[{"name":"Pen","quantity":"2"},{"name":"pen","quantity":"1"}]\') == {"Pen":2,"pen":1}',
      hidden: true,
    },
  ],
  hints: [
    "Think of your result dictionary as one accumulator per item name.",
    "Use get() twice: once for a missing quantity and once for a name not yet in your result.",
    "Inside the loop, convert safely and replace bad or negative quantities with zero. Then add the contribution under that name.",
    "Create stock; for each parsed record, calculate a safe quantity; stock[name] becomes its old value (or zero) plus the quantity; return stock after the loop.",
  ],
  solution:
    'import json\n\ndef inventory_totals(text):\n    records = json.loads(text)\n    stock = {}\n    for record in records:\n        name = record["name"]\n        try:\n            quantity = int(record.get("quantity", "0"))\n        except ValueError:\n            quantity = 0\n        if quantity < 0:\n            quantity = 0\n        stock[name] = stock.get(name, 0) + quantity\n    return stock',
  explain:
    "Each record contributes a nonnegative integer. The dictionary holds one running total per name. Even a zero contribution assigns a key, so invalid and missing quantities do not make items disappear. This is the same pattern used in reports, shopping carts, and inventory apps.",
  complexity:
    "JSON parsing is O(L) in the input-text length. Aggregation takes expected O(n) dictionary operations for n records, excluding arbitrary-size integer costs. Total storage is O(L + k) for parsed input and k distinct item totals.",
  predict: {
    code: 'stock = {"pen": 2}\nstock["pen"] = stock.get("pen", 0) + 3\nprint(stock["pen"])',
    answer: "5",
    options: ["3", "5", "2"],
  },
};
