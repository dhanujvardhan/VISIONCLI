# VisionCLI 🤖👁️

A terminal-based computer vision interface that uses Gemini 3 Flash to analyze camera input via CLI commands.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_3_Flash-orange.svg)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

## 🚀 Overview

**VisionCLI** bridges the gap between traditional command-line workflows and modern multimodal AI. It provides a retro-hacker terminal interface where you can "talk" to your camera feed using technical commands. Whether you're scanning an environment, detecting specific objects, or extracting text from documents, VisionCLI handles it all through a unified terminal experience.

## ✨ Key Features

- **Terminal-First UX**: A fully functional terminal emulator built with React.
- **Real-time Vision**: Integrated camera system with HUD overlays.
- **Intelligent Analysis**: Powered by Gemini 3 Flash for high-speed, accurate visual understanding.
- **Command Suite**:
  - `cam on/off`: Control the hardware camera stream.
  - `scan`: Generate a concise technical description of the current view.
  - `detect [object]`: Locate and describe specific items in the frame.
  - `text`: Perform OCR to extract readable text from the environment.
  - `preview`: Toggle the visual feed window.
  - `report`: Access system architecture and project status.
- **Retro Aesthetic**: Custom-built CRT scanline effects and high-contrast green-on-black styling.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **AI Engine**: `@google/genai` (Gemini 3 Flash)

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/vision-cli.git
   cd vision-cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📖 Usage Guide

Once the terminal initializes:
1. Type `cam on` to start the visual feed.
2. Use `scan` to get an initial reading of the environment.
3. Try `detect laptop` or `detect person` to test object recognition.
4. Use `text` to read labels, signs, or documents.
5. Type `help` at any time to see the full command list.

## 📄 License

This project is licensed under the Apache-2.0 License.

---
*Built with ❤️ using Google AI Studio*
