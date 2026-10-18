const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const error = new Error(`The server returned status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  const data = response.status === 204 ? null : await response.json();
  return { data, status: response.status };
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type ? `status status--${type}` : "status";
}

function renderNotes(notes) {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "No notes yet. Load notes or create your first note.";
    notesList.append(emptyMessage);
    return;
  }

  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No note body.";

    item.append(title, body);
    notesList.append(item);
  }
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...", "loading");

  try {
    const { data: notes } = await request("?_limit=10");
    renderNotes(notes);
    setStatus(
      notes.length === 0
        ? "No notes found."
        : `Loaded ${notes.length} notes from the server.`,
      "success",
    );
  } catch (error) {
    setStatus("Sorry, we couldn't load your notes. Please try again.", "error");
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
