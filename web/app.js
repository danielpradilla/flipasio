const lcdEl = document.getElementById("lcd");
const keysEl = document.querySelector(".keys");
const calcEl = document.querySelector(".calculator");
const flipToggleEl = document.getElementById("flip-toggle");
const uprightToolsEl = document.getElementById("upright-tools");
const translatorRowEl = document.getElementById("translator-row");
const translatorStatusEl = document.getElementById("translator-status");
const wordInputEl = document.getElementById("word-input");
const translateBtnEl = document.getElementById("translate-btn");
const wordListToggleEl = document.getElementById("wordlist-toggle");
const challengeTapeEl = document.getElementById("challenge-tape");
const challengeItemsEl = document.getElementById("challenge-items");
const challengeCloseEl = document.getElementById("challenge-close");
const keyButtons = [...document.querySelectorAll(".key")];

const MAX_CHARS = CalculatorEngine.MAX_CHARS;
const SEGMENTS = ["a", "b", "c", "d", "e", "f", "g"];
const OPERATOR_KEYS = new Set(["+", "-", "*", "/", "x", "X", "×", "÷", "−"]);
const KEY_TO_ACTION = {
  ".": { action: "decimal" },
  Enter: { action: "equals", preventDefault: true },
  "=": { action: "equals", preventDefault: true },
  Backspace: { action: "clear" },
  Escape: { action: "ac" },
};

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
  E: ["a", "d", "e", "f", "g"],
  r: ["e", "g"],
  o: ["c", "d", "e", "g"],
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

const WORD_LIST_FALLBACK = [
  "BEE",
  "BELL",
  "BELLE",
  "BELIES",
  "BELIE",
  "BIBLE",
  "BIBLES",
  "BOOBIES",
  "BOOBS",
  "BOB",
  "BOGGLE",
  "BOGLE",
  "BOSS",
  "BOSSIE",
  "EEL",
  "EELS",
  "EGG",
  "GIG",
  "GIGGLE",
  "GIGGLES",
  "GOOGLE",
  "HELLO",
  "HELL",
  "BESIEGE",
  "HILL",
  "HILLS",
  "ISLE",
  "LESS",
  "LIES",
  "LOL",
  "SILO",
  "SOLEIL",
  "LOGO",
  "BILL",
  "BILLS",
];

const state = {
  calc: CalculatorEngine.createState(),
  flipped: false,
  challengeOpen: false,
  wordPool: [...WORD_LIST_FALLBACK],
  validWordPool: [],
};
let lastTouchEndAt = 0;

function setFlipUI(isFlipped) {
  calcEl.classList.toggle("is-flipped", isFlipped);
  flipToggleEl.setAttribute("aria-pressed", String(isFlipped));
  translatorRowEl.setAttribute("aria-hidden", String(!isFlipped));
  uprightToolsEl.setAttribute("aria-hidden", String(isFlipped));
}

function setChallengeUI(isOpen) {
  challengeTapeEl.hidden = !isOpen;
  wordListToggleEl.setAttribute("aria-expanded", String(isOpen));
}

function setTranslatorStatus(message) {
  translatorStatusEl.textContent = message;
}

function resetState() {
  state.calc = CalculatorEngine.createState();
}

function clearEntry() {
  state.calc = CalculatorEngine.clearEntry(state.calc);
}

function allClear() {
  state.calc = CalculatorEngine.allClear();
}

function toggleFlip() {
  state.flipped = !state.flipped;
  setFlipUI(state.flipped);
  if (state.flipped) {
    setChallengeOpen(false);
  }

  if (!state.flipped) {
    setTranslatorStatus("");
  } else {
    const desktopLikePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (desktopLikePointer) {
      wordInputEl.focus();
    }
  }
}

function inputDigit(digit) {
  state.calc = CalculatorEngine.inputDigit(state.calc, digit);
}

function inputDecimal() {
  state.calc = CalculatorEngine.inputDecimal(state.calc);
}

function chooseOperator(operator) {
  state.calc = CalculatorEngine.chooseOperator(state.calc, operator);
}

function evaluate() {
  state.calc = CalculatorEngine.evaluate(state.calc);
}

function applyTranslatedNumber(numberText) {
  state.calc = CalculatorEngine.applyTranslatedNumber(state.calc, numberText);
  renderDisplay();
}

function wordToCalculatorNumberStrict(word) {
  const mappedDigits = [];

  for (const letter of word) {
    const digit = LETTER_TO_DIGIT_STRICT[letter];
    if (!digit) return null;
    mappedDigits.push(digit);
  }

  let translated = mappedDigits.reverse().join("");
  if (translated.length > 1 && translated.startsWith("0")) {
    translated = `0.${translated.slice(1)}`;
  }
  if (translated.length > MAX_CHARS) return null;
  return translated;
}

function collectUnmappedStrictLetters(word) {
  const unmapped = new Set();
  for (const letter of word) {
    if (!LETTER_TO_DIGIT_STRICT[letter]) {
      unmapped.add(letter);
    }
  }
  return [...unmapped];
}

function rebuildValidWordPool() {
  state.validWordPool = state.wordPool.filter((word) => wordToCalculatorNumberStrict(word));
}

function pickRandomWords(words, count) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function renderChallengeWords() {
  const sourcePool = state.validWordPool.length > 0 ? state.validWordPool : state.wordPool;
  const selected = pickRandomWords(sourcePool, 10);
  const rows = selected.map((word, index) => `<p class="challenge-line" role="listitem">${index + 1}. ${word}</p>`);
  challengeItemsEl.innerHTML = rows.join("");
}

function setChallengeOpen(nextOpen) {
  state.challengeOpen = nextOpen;
  setChallengeUI(nextOpen);
}

function toggleChallengeTape() {
  if (state.flipped) return;
  const nextOpen = !state.challengeOpen;
  setChallengeOpen(nextOpen);
  if (nextOpen) {
    renderChallengeWords();
  }
}

async function loadWordPool() {
  try {
    const response = await fetch("../data/calculator_words.txt", { cache: "no-store" });
    if (!response.ok) return;
    const text = await response.text();
    const words = text
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter((line) => /^[A-Z]+$/.test(line));
    if (words.length >= 10) {
      state.wordPool = [...new Set(words)];
      rebuildValidWordPool();
    }
  } catch (_err) {
    // Keep fallback words when local file loading is unavailable.
  }
}

function translateWordStrict() {
  const rawWord = wordInputEl.value.trim().toUpperCase();

  if (!rawWord) {
    setTranslatorStatus("Type a word first.");
    return;
  }

  if (!/^[A-Z]+$/.test(rawWord)) {
    setTranslatorStatus("Strict mode: letters A-Z only.");
    return;
  }

  const translated = wordToCalculatorNumberStrict(rawWord);
  if (translated === null) {
    const unmapped = collectUnmappedStrictLetters(rawWord);
    if (unmapped.length > 0) {
      setTranslatorStatus(`Strict mode: cannot map ${unmapped.join(", ")}.`);
      return;
    }
    setTranslatorStatus(`Too long for display (${MAX_CHARS} max).`);
    return;
  }

  applyTranslatedNumber(translated);
  setTranslatorStatus(`${rawWord} -> ${translated}`);
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
  const raw = state.calc.error ? "Err" : state.calc.currentInput;
  const text = CalculatorEngine.normalizeDisplayText(raw);

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

const ACTION_HANDLERS = {
  digit: (value) => inputDigit(value),
  decimal: () => inputDecimal(),
  operator: (value) => chooseOperator(value),
  equals: () => evaluate(),
  clear: () => clearEntry(),
  ac: () => allClear(),
};

function runAction(action, value = "") {
  const handler = ACTION_HANDLERS[action];
  if (!handler) return;
  handler(value);

  renderDisplay();
}

function installIOSZoomLock() {
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouchDevice) return;

  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEndAt <= 300) {
        event.preventDefault();
      }
      lastTouchEndAt = now;
    },
    { passive: false },
  );
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

wordListToggleEl.addEventListener("click", () => {
  toggleChallengeTape();
});

challengeCloseEl.addEventListener("click", () => {
  setChallengeOpen(false);
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

  if (OPERATOR_KEYS.has(event.key)) {
    const normalizedOperator = CalculatorEngine.normalizeOperator(event.key);
    if (!normalizedOperator) return;

    runAction("operator", normalizedOperator);
    activateButton("operator", normalizedOperator);
    return;
  }

  const mappedShortcut = KEY_TO_ACTION[event.key];
  if (mappedShortcut) {
    if (mappedShortcut.preventDefault) {
      event.preventDefault();
    }
    runAction(mappedShortcut.action);
    activateButton(mappedShortcut.action);
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFlip();
    return;
  }

  if (event.key.toLowerCase() === "w" && !state.flipped) {
    event.preventDefault();
    toggleChallengeTape();
  }
});

resetState();
rebuildValidWordPool();
loadWordPool();
renderDisplay();
installIOSZoomLock();
