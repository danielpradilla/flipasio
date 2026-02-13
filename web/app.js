const lcdEl = document.getElementById("lcd");
const keysEl = document.querySelector(".keys");
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

const state = {
  display: "0",
  currentInput: "0",
  accumulator: null,
  pendingOperator: null,
  freshInput: true,
  error: false,
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
  const rounded = Number.parseFloat(num.toFixed(9));
  let asText = String(rounded);

  if (asText.length > MAX_CHARS) {
    asText = rounded.toExponential(4);
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

  state.pendingOperator = operator;
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

window.addEventListener("keydown", (event) => {
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

  if (["+", "-", "*", "/"].includes(event.key)) {
    runAction("operator", event.key);
    activateButton("operator", event.key);
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
  }
});

resetState();
renderDisplay();
