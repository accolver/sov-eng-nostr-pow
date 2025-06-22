#!/bin/bash

echo "🔥 Starting Nostr PoW Client..."
echo "This will start a local web server on port 8000"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "🚀 Starting server at http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🚀 Starting server at http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
else
    echo "❌ Python not found. Please install Python 3 to run the server."
    echo "Alternative: You can use any other HTTP server like:"
    echo "  - npx http-server -p 8000"
    echo "  - php -S localhost:8000"
    exit 1
fi
