# Song Generator for Hitster Game

## Project Overview

A Spotify-integrated song card generator for the Hitster board game. The tool generates randomized song cards with metadata (year, title, artists, decade) from Spotify playlists without implementing the full game mechanic.

## Features

- **Spotify Integration**: Connect to Spotify playlists via link
- **Random Song Selection**: Generate cards from user-selected or default playlists
- **Card Information Display**:
  - Release year
  - Song title
  - Artist names with indicators (solo/group/featured artists)
  - Decade (e.g., "años 80", "años 90")
  - Music playback
- **Hidden Metadata**: Card info hidden until revealed
- **Flexible Source**: Use giant playlist or custom user playlist

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Spotify credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Production Deploy (Render)

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions on Render.

**Quick steps:**
1. Push code to GitHub
2. Create account on [Render](https://render.com)
3. Connect your repository
4. Configure environment variables
5. Deploy automatically

---

## 🔧 Configuration

### Required Environment Variables

Create a `.env` file with:

```env
APP_URL="http://localhost:3000"  # Your app URL
SPOTIFY_CLIENT_ID="your_client_id"
SPOTIFY_CLIENT_SECRET="your_client_secret"
```

### Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add Redirect URI: `http://localhost:3000/auth/callback` (for development)
4. Copy Client ID and Client Secret to `.env`

---

## 🎮 How to Use

1. Click "Conectar con Spotify" to authenticate
2. Load a playlist (or use the default HITSTER Mix)
3. Click "Siguiente" to generate a random song
4. Listen to the song preview (info is hidden)
5. Click "Revelar" to show year, title, artists, and decade
6. Use with physical HITSTER Bingo game!

---

## Game Rules Reference

### Setup

- Each team receives 2 HITSTER chips and 1 music card (face-up with year visible)
- Open the HITSTER app

### Winning Condition

- First to correctly place 10 cards on timeline wins
- Tiebreaker: Most HITSTER chips remaining
- Extra rounds if still tied

### Game Flow

1. **Scan**: Opponent scans card and plays music
2. **Discard**: Use 1 chip to skip to different song
3. **Place**: Position card face-down on timeline
4. **Challenge**: Call "HITSTER" if placement seems wrong
5. **Reveal**: Flip card to verify correct position

### HITSTER Chips (Max 5)

- **Your turn**: Switch songs
- **Opponent's turn**: Challenge their card placement
- **Anytime**: Trade 3 chips for top deck card (auto-place)

### Cooperative Mode

- 5 chips, 1 starting card
- Lose 1 chip per incorrect placement
- Win with 10 correctly placed cards

---

## 📦 Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Motion
- **Backend**: Express.js, Spotify Web API
- **Deployment**: Render (or Railway)
