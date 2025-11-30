# The Binding of Sigma: Ohio Dungeon

A Gen Alpha slang-themed roguelike dungeon crawler inspired by *The Binding of Isaac*. This game features procedural dungeon generation, twin-stick shooter mechanics, and generative AI content powered by the Google Gemini API.

## Description

**The Binding of Sigma** puts players in the shoes of a tearful protagonist navigating the "Ohio Dungeon". Battle through rooms filled with memes, slang-obsessed enemies, and powerful "Rizz" based items.

The game leverages **Google's Gemini API** to generate unique, slang-filled descriptions for items and taunts for bosses, ensuring no two runs feel exactly the same (at least in terms of brain rot).

## Features

*   **Procedural Generation**: Randomly generated dungeon layouts with unique room configurations.
*   **Twin-Stick Shooting**: Classic WASD movement and Arrow Key/Joystick shooting controls.
*   **AI-Powered Flavor**: Item descriptions and boss taunts are generated in real-time using the Gemini API, styled in "Gen Alpha" slang.
*   **Touch & Mouse Support**: Playable on desktop with keyboard/mouse or touch devices with virtual joysticks.
*   **Diverse Enemies**: Face off against Shooters, Dashers, Tanks, and the dreaded Boss.
*   **Item System**: Collect items to boost stats like Damage (Rizz), Speed (Zoom), and Fire Rate (Yap).

## Prerequisites

*   **Node.js**: Ensure you have Node.js installed (v18+ recommended).
*   **Google Gemini API Key**: You need an API key from Google AI Studio to enable the AI features.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/the-binding-of-sigma.git
    cd the-binding-of-sigma
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

To enable the AI features, you must set up your environment variables.

1.  Create a `.env.local` file in the root directory.
2.  Add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

## Usage

### Development Server
Run the game locally in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build
Build the app for production:
```bash
npm run build
```

### Preview
Preview the production build:
```bash
npm run preview
```

## How to Play

*   **Move**: `W`, `A`, `S`, `D` keys or Left Virtual Joystick.
*   **Shoot**: `Arrow Keys` or Right Virtual Joystick.
*   **Goal**: Navigate the dungeon, defeat enemies to clear rooms, find the Boss Room, and defeat the Boss to win.
*   **Items**: Clear rooms or find the specialized Item Room (Gold) to collect upgrades.

## Project Structure

*   `App.tsx`: Main game loop and state management.
*   `components/`: React components for rendering the game.
    *   `GameRenderer.tsx`: Canvas-based rendering engine.
    *   `HUD.tsx`: Heads-Up Display for health and stats.
    *   `Joystick.tsx`: Virtual joystick implementation.
*   `services/`: External service integrations.
    *   `geminiService.ts`: Google Gemini API interaction logic.
*   `types.ts`: TypeScript definitions for entities, game state, etc.
*   `constants.ts`: Game configuration constants (dimensions, colors, speeds).

## License

This project is licensed under the MIT License.
