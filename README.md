# Codeforces Extension (CF Workspace) ⚡

A modern, high-performance in-browser workspace and competitive programming IDE built for Codeforces. Solve problems, experiment with custom test cases, run code in real time, and submit directly—all inside a sleek, customizable glassmorphic interface.

---

## 🚀 Quick Install

1. Download or clone this repository to your computer.
2. Open Google Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Drag and drop the downloaded folder into the extensions page (or click **Load unpacked** and select the folder).

---

## ✨ Features

### ⚡ Codeforces Integration
- **Direct Workspace Launcher**: Injects a clean `⚡ CF Workspace` button directly onto any Codeforces problem page (Contest, Problemset, and Gym).
- **Auto-Fetching**: Automatically parses problem statements, time limits, memory limits, and sample test cases.
- **Direct Submission**: Submit your accepted solution directly to Codeforces in one click.

### 🎨 Apple Glassmorphism & Multi-Theme System
- **Frameless Floating Navbar**: Modern floating controls that sit cleanly over the workspace background.
- **⚡ Xenogen Amber**: Sci-fi industrial mecha stencil design with amber-gold marble textures and cybernetic HUD bracket trace lines.
- **🌿 Jungle Cat**: Lush translucent emerald backdrop with frosted glass panels.
- **🌅 Sunset Horizon**: Cyberpunk anime twilight skyline with smooth frosted aesthetics.
- **🩸 Azidox Crimson**: Pure pitch-black obsidian with metallic ruby-red 3D chrome accents.
- **🌌 Midnight OLED**: True pitch-black OLED background with high-contrast text.
- **🕊️ Pure Light**: Clean, minimalist light mode with high-contrast burnished gold typography.

### 💻 Full-Featured Code Editor
- **Multi-Language Support**: Complete syntax highlighting and execution for C++, Python, Java, JavaScript, and more.
- **Auto-Save Protection**: Automatically persists your code in local storage so you never lose your progress during contests.
- **Flexible Workspace Split**: Smooth, draggable panel dividers between the problem statement, editor, and bottom dock.

### 🧪 Live Testbench & Code Execution
- **Sample Test Suite**: Automatically imports and runs your code against all official sample test cases.
- **Custom Input Sandbox**: Test edge cases and large custom inputs before submitting.
- **Instant Hover Navigation**: Switch fluidly between Sample Tests, Custom Input, Output, and Verdicts by hovering your cursor over tabs.
- **Live Output & Verdicts**: Real-time feedback with execution time, memory usage, and detailed compile/runtime error messages.

### 🤖 AI Problem Assistant
- **Automated Hints & Approaches**: Break down complex algorithmic problems with hints, time complexity guidance, and optimal code implementations powered by Google Gemini.

### ⏱️ Contest Utilities
- **Built-In Stopwatch**: Track your solving speed with an integrated timer.
- **Problem Picker & Search**: Roll random problems (🎲) or quickly navigate to any problem code (e.g. `1900B`, `231A`).

---

## 🔒 Security & Privacy

- **Safe Client Architecture**: Utilizes public anonymous Supabase keys with strict Row Level Security (RLS) policies.
- **Isolated Server Edge Functions**: Sensitive API keys and AI processing run exclusively inside secure Supabase Edge Functions with rate limiting and origin checks.
- **No Data Harvesting**: Your credentials, cookies, and code remain local and under your control.

---

## 🛠️ Tech Stack

- **Platform**: Chrome Extensions Manifest V3
- **Editor**: CodeMirror
- **Execution Service**: Wandbox API
- **Backend & Auth**: Supabase Auth & Edge Functions
- **AI Engine**: Google Gemini
