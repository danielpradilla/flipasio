# SPEC: Retro 80s Casio Calculator (Project 5318008)

## 1. Product Goal
Build a browser-based calculator that visually and behaviorally emulates a classic 1980s Casio calculator, including:
- Realistic segmented LCD screen
- Pixel-perfect LCD character rendering style
- Distinct colored operation keys (matching vintage calculator design cues)
- A signature **Flip** feature to invert the calculator so entered digits can be read as upside-down words (e.g., "BOOBIES", "LEET")

## 2. Core Experience
The app should feel like using a physical calculator from the 80s:
- Strong retro industrial design language
- Tactile-feeling button interactions
- Authentic 7-segment style rendering
- Limited but intentional animation

The key delight moment is pressing **Flip** and seeing the entire calculator invert while the display remains readable as upside-down text.

## 3. Functional Requirements

### 3.1 Calculator Engine
- Support basic operations: `+`, `-`, `*`, `/`
- Support decimal input
- Support clear (`C`) and all-clear (`AC`)
- Support equals (`=`)
- Handle divide-by-zero gracefully (show error state on display)

### 3.2 Input Methods
- Mouse/touch button input
- Keyboard mapping:
  - `0-9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Escape`

### 3.3 Display Behavior
- Display numeric input and results in segmented LCD style
- Max visible character count with overflow handling
- Optional brief error text mode for invalid operations

### 3.4 Flip Mode (Signature Feature)
- Dedicated `Flip` button toggles orientation by 180 degrees
- UI animation rotates calculator body smoothly
- Display content remains logically tied to current value
- User can continue calculating while flipped
- Provide a helper/legend section with common upside-down number words:
  - `5318008 -> BOOBIES`
  - `7734 -> hELL`
  - `0.7734 -> Oh hELL`
  - `713705 -> sLOiL` (example stylized mapping)

## 4. Visual/Design Requirements

### 4.1 Retro Hardware Styling
- Calculator body with slight bevel and realistic shadows
- Vintage color palette (off-white/gray body + high-contrast key colors)
- Distinct key groups using color coding:
  - Digits: neutral
  - Operations: warm accent (orange/yellow)
  - Clear/utility: contrasting accent

### 4.2 LCD Screen Fidelity
- Simulate old segmented LCD:
  - Segment geometry with hard pixel edges
  - Slight background tint (green/gray)
  - Dark segment strokes with subtle bleed
  - Active segment color should use the darker tuned tone `#3f4b44` for improved authenticity
- Characters should look crisp and intentionally "digital"

### 4.3 Motion
- Power-on/load reveal animation (subtle)
- Button press depth animation
- Flip animation (main motion element)

## 5. Non-Functional Requirements
- Responsive for desktop and mobile
- Fast interactions (<16ms perceived button latency on modern browsers)
- Accessible controls (keyboard support, labels, sufficient contrast)
- Works in latest Chrome, Safari, Firefox, and Edge

## 6. Technical Approach (Suggested)
- Stack: HTML, CSS, JavaScript (or TypeScript)
- Rendering:
  - Prefer CSS/DOM for body and buttons
  - Use SVG or CSS-driven segment components for LCD characters
- State machine for calculator logic and flip orientation state

## 7. Acceptance Criteria
- App resembles an 80s Casio calculator at first glance
- LCD characters appear segmented and pixel-faithful
- Colored special-operation keys are clearly differentiated
- Flip button rotates calculator 180 degrees and enables upside-down word play
- Standard calculations are correct for basic operations
- Keyboard and pointer input both function correctly
