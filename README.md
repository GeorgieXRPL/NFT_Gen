# NFT Collection Creator

A tool for creating NFT collections with traits, layers, and rules for trait combinations.

## Features

- Create and manage trait layers
- Upload trait images
- Set trait rarities
- Define combination rules
- Generate random NFTs
- Preview NFTs
- Deterministic generation with seeds

## Setup & Running

### Prerequisites

- Python 3.x (for the HTTP server)

### Starting the Application

#### Option 1: Using the batch file (Windows)

1. Double-click the `run-server.bat` file
2. Open your browser and go to http://localhost:8080

#### Option 2: Using the command line

1. Open a terminal or command prompt
2. Navigate to the project directory
3. Run: `python -m http.server 8080`
4. Open your browser and go to http://localhost:8080

#### Option 3: Using npm scripts (if you have Node.js installed)

1. Open a terminal or command prompt
2. Navigate to the project directory
3. Run: `npm run dev`
4. Open your browser and go to http://localhost:8080

## Usage Guide

1. **Create Trait Layers**:
   - Go to the "Traits & Rules" tab
   - Click "Add Layer" to create a new trait layer (e.g., "Background", "Eyes", "Mouth")
   - Set the layer's name and rarity percentage

2. **Add Traits**:
   - Within each layer, add traits by clicking the "+" button
   - Upload an image for each trait
   - Set the trait's rarity percentage

3. **Create Rules** (optional):
   - Define combination rules to control which traits can and cannot be combined together
   - Available rule types: "Never Combine" and "Always on Top/Bottom"

4. **Generate NFTs**:
   - Go to the "Generate NFTs" tab
   - Click "Randomize" to create a random NFT
   - Use "Override Rules" to ignore combination rules
   - Use "Seed" to create deterministic NFTs with specific seeds

## Troubleshooting

If you see CORS errors or issues loading resources:
- Make sure you're running the application through the HTTP server as described above
- Do not open the HTML file directly in your browser as this won't work due to browser security restrictions

## License

MIT 