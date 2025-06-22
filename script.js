class NostrPowClient {
  constructor() {
    this.relays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.snort.social",
      "wss://relay.nostr.band",
      "wss://nostr.wine",
    ];
    this.connections = {};
    this.isConnected = false;
    this.notes = [];
    this.subscriptionId = this.generateId();

    this.initEventListeners();
  }

  initEventListeners() {
    document
      .getElementById("connectBtn")
      .addEventListener("click", () => this.connect());
    document
      .getElementById("refreshBtn")
      .addEventListener("click", () => this.fetchNotes());
    document
      .getElementById("minPow")
      .addEventListener("input", () => this.filterAndRenderNotes());
    document
      .getElementById("maxNotes")
      .addEventListener("input", () => this.filterAndRenderNotes());
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  async connect() {
    const connectBtn = document.getElementById("connectBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const status = document.getElementById("status");

    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";
    status.textContent = "Connecting to relays...";

    try {
      // Test connections to relays
      const connectionPromises = this.relays.map((relay) =>
        this.connectToRelay(relay)
      );
      const results = await Promise.allSettled(connectionPromises);

      const successfulConnections = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      if (successfulConnections === 0) {
        throw new Error("No relays available");
      }

      this.isConnected = true;
      connectBtn.textContent = "Connected";
      refreshBtn.disabled = false;
      status.textContent = `Connected to ${successfulConnections} relays`;

      // Auto-fetch notes
      await this.fetchNotes();
    } catch (error) {
      console.error("Failed to connect:", error);
      status.textContent = "Connection failed";
      connectBtn.disabled = false;
      connectBtn.textContent = "Retry Connection";
    }
  }

  connectToRelay(relayUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);

      ws.onopen = () => {
        console.log(`Connected to ${relayUrl}`);
        this.connections[relayUrl] = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error(`Failed to connect to ${relayUrl}:`, error);
        reject(error);
      };

      ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          reject(new Error("Connection timeout"));
        }
      }, 5000);
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      if (message[0] === "EVENT" && message[1] === this.subscriptionId) {
        const event = message[2];
        if (event.kind === 1) {
          // Text note
          const pow = this.calculatePoW(event.id);
          const note = {
            ...event,
            pow: pow,
            powDisplay: this.formatPoW(pow),
          };
          this.notes.push(note);
        }
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  async fetchNotes() {
    if (!this.isConnected) return;

    const loading = document.getElementById("loading");
    const status = document.getElementById("status");

    loading.classList.remove("hidden");
    status.textContent = "Fetching notes...";

    this.notes = []; // Clear existing notes

    try {
      // Create filter for recent text notes
      const filter = {
        kinds: [1],
        since: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // Last 24 hours
        limit: 500,
      };

      // Send REQ message to all connected relays
      const reqMessage = JSON.stringify(["REQ", this.subscriptionId, filter]);

      Object.values(this.connections).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(reqMessage);
        }
      });

      // Wait for responses
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Send CLOSE message
      const closeMessage = JSON.stringify(["CLOSE", this.subscriptionId]);
      Object.values(this.connections).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(closeMessage);
        }
      });

      // Remove duplicates based on ID
      const uniqueNotes = this.notes.filter(
        (note, index, self) => index === self.findIndex((n) => n.id === note.id)
      );
      this.notes = uniqueNotes;

      // Sort by PoW (highest first)
      this.notes.sort((a, b) => b.pow - a.pow);

      status.textContent = `Loaded ${this.notes.length} notes`;
      this.filterAndRenderNotes();
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      status.textContent = "Failed to fetch notes";
    } finally {
      loading.classList.add("hidden");
    }
  }

  calculatePoW(eventId) {
    // Count leading zeros in the event ID (hex string)
    let zeros = 0;
    for (let i = 0; i < eventId.length; i++) {
      if (eventId[i] === "0") {
        zeros++;
      } else {
        break;
      }
    }

    // Convert hex zeros to binary zeros (each hex 0 = 4 binary zeros)
    const binaryZeros = zeros * 4;

    // For more precise PoW calculation, look at the first non-zero digit
    let precisePow = binaryZeros;
    if (zeros < eventId.length) {
      const firstNonZero = parseInt(eventId[zeros], 16);
      // Add fractional difficulty based on the first non-zero hex digit
      if (firstNonZero >= 8) precisePow += 0;
      else if (firstNonZero >= 4) precisePow += 1;
      else if (firstNonZero >= 2) precisePow += 2;
      else precisePow += 3;
    }

    return precisePow;
  }

  formatPoW(pow) {
    if (pow === 0) return "0";
    if (pow < 10) return pow.toFixed(1);
    return Math.floor(pow).toString();
  }

  filterAndRenderNotes() {
    const minPow = parseFloat(document.getElementById("minPow").value) || 0;
    const maxNotes = parseInt(document.getElementById("maxNotes").value) || 50;

    const filteredNotes = this.notes
      .filter((note) => note.pow >= minPow)
      .slice(0, maxNotes);

    this.renderNotes(filteredNotes);
  }

  renderNotes(notes) {
    const notesContainer = document.getElementById("notes");

    if (notes.length === 0) {
      notesContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No notes found</h3>
                    <p>Try lowering the minimum PoW filter or refreshing the notes.</p>
                </div>
            `;
      return;
    }

    notesContainer.innerHTML = notes
      .map((note) => this.renderNote(note))
      .join("");
  }

  renderNote(note) {
    const date = new Date(note.created_at * 1000);
    const timeAgo = this.getTimeAgo(date);
    const shortId = note.id.substring(0, 16) + "...";
    const authorDisplay = this.getAuthorDisplay(note.pubkey);
    const powClass = note.pow >= 16 ? "high-pow" : "";

    return `
            <div class="note">
                <div class="note-header">
                    <div>
                        <div class="note-author">${authorDisplay}</div>
                        <div class="note-time">${timeAgo}</div>
                    </div>
                    <div class="note-pow ${powClass}">
                        ⚡ ${note.powDisplay} PoW
                    </div>
                </div>

                <div class="pow-bar" style="width: ${Math.min(
                  note.pow * 6,
                  100
                )}%"></div>

                <div class="note-content">${this.sanitizeContent(
                  note.content
                )}</div>

                <div class="note-meta">
                    <span class="note-id">ID: ${shortId}</span>
                    <span>Leading zeros: ${Math.floor(note.pow)}</span>
                </div>
            </div>
        `;
  }

  getAuthorDisplay(pubkey) {
    // Show shortened pubkey since we don't have profile data
    return `${pubkey.substring(0, 16)}...`;
  }

  sanitizeContent(content) {
    // Basic sanitization and formatting
    return (
      content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\n/g, "<br>")
        .substring(0, 500) + (content.length > 500 ? "..." : "")
    );
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}

// Initialize the client when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const client = new NostrPowClient();
  console.log("Nostr PoW Client initialized");
});
