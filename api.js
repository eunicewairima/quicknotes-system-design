const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
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
    item.dataset.noteId = note.id;

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

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    titleInput.focus();
    setStatus("A title is required.", "error");
    return;
  }

  if (title.length > 100) {
    setStatus("Titles must be 100 characters or fewer.", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...", "loading");

  try {
    const { data: note, status } = await request("", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    const existingNotes = [...notesList.querySelectorAll(".note-card")].map((item) => ({
      id: item.dataset.noteId,
      title: item.querySelector("h3").textContent,
      body: item.querySelector("p").textContent,
    }));
    renderNotes([note, ...existingNotes]);
    setStatus(`Note created (status ${status}, id ${note.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus("Sorry, we couldn't create your note. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
