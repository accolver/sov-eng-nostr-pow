# 🔥 Nostr PoW Client

A web-based Nostr client that displays notes sorted by their Proof of Work (PoW) difficulty.

[Example deployment](https://storage.googleapis.com/sov-eng-nostr-pow-hosting/index.html)

## Features

- **PoW Calculation**: Automatically calculates the PoW difficulty for each note based on leading zeros in the note ID
- **Smart Sorting**: Notes are sorted by PoW difficulty (highest first)
- **Visual PoW Display**: Each note shows its PoW value with visual indicators and color coding
- **Filtering**: Filter notes by minimum PoW difficulty
- **Real-time**: Connects to multiple Nostr relays for live data
- **Responsive Design**: Modern, mobile-friendly interface

## How PoW Works in Nostr

Proof of Work in Nostr is calculated by counting the number of leading zeros in the SHA-256 hash of the note ID. The more leading zeros, the higher the difficulty:

- 0 zeros = PoW 0 (no proof of work)
- 4 zeros = PoW 16 (moderate difficulty)
- 5 zeros = PoW 20 (high difficulty)
- 6+ zeros = PoW 24+ (very high difficulty)

## Getting Started

### Option 1: Simple HTTP Server (Recommended)

```bash
# Start a simple HTTP server
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Open your browser
open http://localhost:8000
```

### Option 2: Direct File Access

Some browsers may work with direct file access, but CORS issues may prevent the CDN imports from working.

## Usage

1. Click **"Connect to Relays"** to establish connections to Nostr relays
2. The client will automatically fetch recent notes (last 24 hours)
3. Notes are displayed sorted by PoW difficulty (highest first)
4. Use the **"Minimum PoW"** filter to show only notes above a certain difficulty
5. Adjust **"Max Notes"** to control how many notes are displayed
6. Click **"Refresh Notes"** to fetch new notes

## Technical Details

- **Frontend**: Pure HTML/CSS/JavaScript with modern ES6+ features
- **Nostr Library**: Uses `nostr-tools` via CDN for Nostr protocol handling
- **Relays**: Connects to popular public Nostr relays
- **PoW Calculation**: Custom algorithm for precise PoW difficulty calculation

## Relay List

The client connects to these public Nostr relays:
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.snort.social
- wss://relay.nostr.band
- wss://nostr.wine

## Contributing

Feel free to enhance the client with additional features like:
- User profiles and metadata
- Note replies and threads
- Custom relay configuration
- PoW mining interface
- Export/import functionality

## License

MIT License - feel free to modify and distribute as needed.
# sov-eng-nostr-pow
