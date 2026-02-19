const CalculatorEngine = (() => {
  const MAX_CHARS = 10;

  function createState() {
    return {
      display: "0",
      currentInput: "0",
      accumulator: null,
      pendingOperator: null,
      freshInput: true,
      error: false,
    };
  }

  function normalizeDisplayText(text) {
    if (text.length > MAX_CHARS) {
      return "Err";
    }

    return text.padStart(MAX_CHARS, " ");
  }

  function formatExponential(num) {
    return num.toExponential(4).replace("e", "E").replace("E+", "E");
  }

  function formatNumber(num) {
    if (!Number.isFinite(num)) return "Err";

    const absNum = Math.abs(num);
    let asText = "";

    if (absNum > 0 && absNum < 0.0000001) {
      asText = formatExponential(num);
    } else {
      asText = num.toFixed(8).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    }

    if (asText.length > MAX_CHARS) {
      asText = formatExponential(num);
    }

    if (asText.length > MAX_CHARS) {
      return "Err";
    }

    return asText;
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

  function commitError() {
    return {
      display: "Err",
      currentInput: "0",
      accumulator: null,
      pendingOperator: null,
      freshInput: true,
      error: true,
    };
  }

  function setDisplayFromCurrent(state) {
    return {
      ...state,
      display: normalizeDisplayText(state.currentInput),
    };
  }

  function clearEntry(state) {
    if (state.error) {
      return createState();
    }

    return {
      ...state,
      currentInput: "0",
      display: "0",
      freshInput: true,
    };
  }

  function allClear() {
    return createState();
  }

  function inputDigit(state, digit) {
    const safeState = state.error ? createState() : state;

    let currentInput = safeState.currentInput;
    let freshInput = safeState.freshInput;

    if (freshInput) {
      currentInput = digit;
      freshInput = false;
    } else if (currentInput === "0") {
      currentInput = digit;
    } else if (currentInput.length < MAX_CHARS) {
      currentInput += digit;
    }

    return setDisplayFromCurrent({
      ...safeState,
      currentInput,
      freshInput,
    });
  }

  function inputDecimal(state) {
    const safeState = state.error ? createState() : state;

    let currentInput = safeState.currentInput;
    let freshInput = safeState.freshInput;

    if (freshInput) {
      currentInput = "0.";
      freshInput = false;
    } else if (!currentInput.includes(".")) {
      currentInput += ".";
    }

    return setDisplayFromCurrent({
      ...safeState,
      currentInput,
      freshInput,
    });
  }

  function chooseOperator(state, operator) {
    if (state.error) return state;

    const normalizedOperator = normalizeOperator(operator);
    if (!normalizedOperator) return state;

    const currentValue = Number(state.currentInput);
    let nextState = { ...state };

    if (nextState.pendingOperator && !nextState.freshInput) {
      const result = applyOperation(nextState.accumulator, nextState.pendingOperator, currentValue);
      if (result === null) {
        return commitError();
      }

      const formatted = formatNumber(result);
      if (formatted === "Err") {
        return commitError();
      }

      nextState = {
        ...nextState,
        accumulator: result,
        currentInput: formatted,
        display: normalizeDisplayText(formatted),
      };
    } else if (nextState.accumulator === null) {
      nextState = {
        ...nextState,
        accumulator: currentValue,
      };
    }

    return {
      ...nextState,
      pendingOperator: normalizedOperator,
      freshInput: true,
    };
  }

  function evaluate(state) {
    if (state.error || state.pendingOperator === null) return state;

    const rightValue = Number(state.currentInput);
    const result = applyOperation(state.accumulator, state.pendingOperator, rightValue);

    if (result === null) {
      return commitError();
    }

    const formatted = formatNumber(result);
    if (formatted === "Err") {
      return commitError();
    }

    return {
      ...state,
      currentInput: formatted,
      display: normalizeDisplayText(formatted),
      accumulator: result,
      pendingOperator: null,
      freshInput: true,
      error: false,
    };
  }

  function applyTranslatedNumber(state, numberText) {
    return {
      ...state,
      currentInput: numberText,
      display: normalizeDisplayText(numberText),
      accumulator: null,
      pendingOperator: null,
      freshInput: true,
      error: false,
    };
  }

  return {
    MAX_CHARS,
    createState,
    normalizeDisplayText,
    normalizeOperator,
    clearEntry,
    allClear,
    inputDigit,
    inputDecimal,
    chooseOperator,
    evaluate,
    applyTranslatedNumber,
  };
})();
