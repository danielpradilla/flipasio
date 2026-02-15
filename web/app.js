const lcdEl = document.getElementById("lcd");
const keysEl = document.querySelector(".keys");
const calcEl = document.querySelector(".calculator");
const flipToggleEl = document.getElementById("flip-toggle");
const translatorRowEl = document.getElementById("translator-row");
const translatorStatusEl = document.getElementById("translator-status");
const wordInputEl = document.getElementById("word-input");
const translateBtnEl = document.getElementById("translate-btn");
const keyButtons = [...document.querySelectorAll(".key")];

const MAX_CHARS = 10;
const SEGMENTS = ["a", "b", "c", "d", "e", "f", "g"];

const CHAR_SEGMENTS = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "d", "e", "g"],
  "3": ["a", "b", "c", "d", "g"],
  "4": ["b", "c", "f", "g"],
  "5": ["a", "c", "d", "f", "g"],
  "6": ["a", "c", "d", "e", "f", "g"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
  "-": ["g"],
  "E": ["a", "d", "e", "f", "g"],
  "r": ["e", "g"],
  "o": ["c", "d", "e", "g"],
  " ": [],
};

const LETTER_TO_DIGIT_STRICT = {
  A: "4",
  B: "8",
  E: "3",
  G: "6",
  H: "4",
  I: "1",
  L: "7",
  O: "0",
  Q: "0",
  S: "5",
  T: "7",
  Z: "2",
};

const state = {
  display: "0",
  currentInput: "0",
  accumulator: null,
  pendingOperator: null,
  freshInput: true,
  error: false,
  flipped: false,
};

function resetState() {
  state.display = "0";
  state.currentInput = "0";
  state.accumulator = null;
  state.pendingOperator = null;
  state.freshInput = true;
  state.error = false;
}

function clearEntry() {
  if (state.error) {
    resetState();
  } else {
    state.currentInput = "0";
    state.display = "0";
    state.freshInput = true;
  }
}

function allClear() {
  resetState();
}

function formatNumber(num) {
  if (!Number.isFinite(num)) return "Err";

  const rounded = Number.parseFloat(num.toFixed(10));

  // Prefer fixed-point output so division results stay readable on the LCD.
  let asText = rounded.toFixed(8).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

  if (asText.length > MAX_CHARS) {
    // Fallback to scientific notation if the value still doesn't fit.
    asText = rounded.toExponential(4).replace("e", "E").replace("E+", "E");
  }

  if (asText.length > MAX_CHARS) {
    return "Err";
  }

  return asText;
}

function normalizeDisplayText(text) {
  if (text.length > MAX_CHARS) {
    return "Err";
  }

  return text.padStart(MAX_CHARS, " ");
}

function commitError() {
  state.display = "Err";
  state.currentInput = "0";
  state.accumulator = null;
  state.pendingOperator = null;
  state.freshInput = true;
  state.error = true;
}

function normalizeOperator(operator) {
  if (operator === "×" || operator === "x" || operator === "X") return "*";
  if (operator === "÷") return "/";
  if (operator === "−") return "-";
  if (["+", "-", "*", "/"].includes(operator)) return operator;
  return null;
}

function applyOperation(left, operator, right) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "*") return left * right;
  if (operator === "/") {
    if (right === 0) return null;
    return left / right;
  }

  return right;
}

function toggleFlip() {
  state.flipped = !state.flipped;
  calcEl.classList.toggle("is-flipped", state.flipped);
  flipToggleEl.setAttribute("aria-pressed", String(state.flipped));
  translatorRowEl.setAttribute("aria-hidden", String(!state.flipped));

  if (!state.flipped) {
    translatorStatusEl.textContent = "";
  } else {
    wordInputEl.focus();
  }
}

function setDisplayFromCurrent() {
  state.display = normalizeDisplayText(state.currentInput);
}

function inputDigit(digit) {
  if (state.error) resetState();

  if (state.freshInput) {
    state.currentInput = digit;
    state.freshInput = false;
  } else if (state.currentInput === "0") {
    state.currentInput = digit;
  } else if (state.currentInput.length < MAX_CHARS) {
    state.currentInput += digit;
  }

  setDisplayFromCurrent();
}

function inputDecimal() {
  if (state.error) resetState();

  if (state.freshInput) {
    state.currentInput = "0.";
    state.freshInput = false;
  } else if (!state.currentInput.includes(".")) {
    state.currentInput += ".";
  }

  setDisplayFromCurrent();
}

function chooseOperator(operator) {
  if (state.error) return;

  const normalizedOperator = normalizeOperator(operator);
  if (!normalizedOperator) return;

  const currentValue = Number(state.currentInput);

  if (state.pendingOperator && !state.freshInput) {
    const result = applyOperation(state.accumulator, state.pendingOperator, currentValue);
    if (result === null) {
      commitError();
      return;
    }
    state.accumulator = result;
    const formatted = formatNumber(result);
    if (formatted === "Err") {
      commitError();
      return;
    }
    state.currentInput = formatted;
    state.display = normalizeDisplayText(formatted);
  } else if (state.accumulator === null) {
    state.accumulator = currentValue;
  }

  state.pendingOperator = normalizedOperator;
  state.freshInput = true;
}

function evaluate() {
  if (state.error || state.pendingOperator === null) return;

  const rightValue = Number(state.currentInput);
  const result = applyOperation(state.accumulator, state.pendingOperator, rightValue);
  if (result === null) {
    commitError();
    return;
  }

  const formatted = formatNumber(result);
  if (formatted === "Err") {
    commitError();
    return;
  }

  state.currentInput = formatted;
  state.display = normalizeDisplayText(formatted);
  state.accumulator = result;
  state.pendingOperator = null;
  state.freshInput = true;
}

function applyTranslatedNumber(numberText) {
  state.currentInput = numberText;
  state.display = normalizeDisplayText(numberText);
  state.accumulator = null;
  state.pendingOperator = null;
  state.freshInput = true;
  state.error = false;
  renderDisplay();
}

function translateWordStrict() {
  const rawWord = wordInputEl.value.trim().toUpperCase();

  if (!rawWord) {
    translatorStatusEl.textContent = "Type a word first.";
    return;
  }

  if (!/^[A-Z]+$/.test(rawWord)) {
    translatorStatusEl.textContent = "Strict mode: letters A-Z only.";
    return;
  }

  const unmapped = [];
  const mappedDigits = [];

  for (const letter of rawWord) {
    const digit = LETTER_TO_DIGIT_STRICT[letter];
    if (!digit) {
      unmapped.push(letter);
    } else {
      mappedDigits.push(digit);
    }
  }

  if (unmapped.length > 0) {
    translatorStatusEl.textContent = `Strict mode: cannot map ${[...new Set(unmapped)].join(", ")}.`;
    return;
  }

  // Reverse so upside-down reading matches the typed word.
  let translated = mappedDigits.reverse().join("");

  // Preserve leading zero words (e.g. HELLO -> 0.7734 instead of 07734).
  if (translated.length > 1 && translated.startsWith("0")) {
    translated = `0.${translated.slice(1)}`;
  }

  if (translated.length > MAX_CHARS) {
    translatorStatusEl.textContent = `Too long for display (${MAX_CHARS} max).`;
    return;
  }

  applyTranslatedNumber(translated);
  translatorStatusEl.textContent = `${rawWord} -> ${translated}`;
}

function renderCharacter(char, withDot = false) {
  const charEl = document.createElement("div");
  charEl.className = "lcd-char";
  const activeSegments = CHAR_SEGMENTS[char] || [];

  SEGMENTS.forEach((segmentName) => {
    const segment = document.createElement("span");
    segment.className = `seg ${segmentName}`;
    if (activeSegments.includes(segmentName)) {
      segment.classList.add("on");
    }
    charEl.appendChild(segment);
  });

  const dot = document.createElement("span");
  dot.className = "seg dot";
  if (withDot) dot.classList.add("on");
  charEl.appendChild(dot);

  return charEl;
}

function renderDisplay() {
  lcdEl.textContent = "";
  const raw = state.error ? "Err" : state.currentInput;
  const text = normalizeDisplayText(raw);

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextIsDot = text[i + 1] === ".";

    if (char === ".") continue;

    lcdEl.appendChild(renderCharacter(char, nextIsDot));
  }
}

function activateButton(action, value) {
  const button = keyButtons.find((candidate) => {
    const sameAction = candidate.dataset.action === action;
    const sameValue = (candidate.dataset.value || "") === (value || "");
    return sameAction && sameValue;
  });

  if (!button) return;

  button.classList.add("is-active");
  window.setTimeout(() => button.classList.remove("is-active"), 110);
}

function runAction(action, value = "") {
  if (action === "digit") {
    inputDigit(value);
  } else if (action === "decimal") {
    inputDecimal();
  } else if (action === "operator") {
    chooseOperator(value);
  } else if (action === "equals") {
    evaluate();
  } else if (action === "clear") {
    clearEntry();
  } else if (action === "ac") {
    allClear();
  }

  renderDisplay();
}

keysEl.addEventListener("click", (event) => {
  const button = event.target.closest(".key");
  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value || "";
  runAction(action, value);
});

flipToggleEl.addEventListener("click", () => {
  toggleFlip();
});

translateBtnEl.addEventListener("click", () => {
  translateWordStrict();
});

wordInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    translateWordStrict();
  }
});

window.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
    return;
  }
  if (event.key >= "0" && event.key <= "9") {
    runAction("digit", event.key);
    activateButton("digit", event.key);
    return;
  }

  if (event.key === ".") {
    runAction("decimal");
    activateButton("decimal");
    return;
  }

  if (["+", "-", "*", "/", "x", "X", "×", "÷", "−"].includes(event.key)) {
    const normalizedOperator = normalizeOperator(event.key);
    if (!normalizedOperator) return;

    runAction("operator", normalizedOperator);
    activateButton("operator", normalizedOperator);
    return;
  }

  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    runAction("equals");
    activateButton("equals");
    return;
  }

  if (event.key === "Backspace") {
    runAction("clear");
    activateButton("clear");
    return;
  }

  if (event.key === "Escape") {
    runAction("ac");
    activateButton("ac");
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFlip();
  }
});

resetState();
renderDisplay();
