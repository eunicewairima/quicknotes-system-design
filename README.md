# QuickNotes System Design

QuickNotes is a note-taking service design exercise. It includes a small browser client that demonstrates GET, POST and DELETE requests against the JSONPlaceholder practice API, along with the API, data model and architecture documents for a production service designed to scale to one million users.

## Run the API client

1. Open this directory in Visual Studio Code.
2. Start a local static server (for example, Live Server) from this folder.
3. Open the served `index.html` page and select **Load notes** or create a note.

The client requires an internet connection to reach `https://jsonplaceholder.typicode.com/posts`. JSONPlaceholder is a practice service: created and deleted notes are not persisted. A create or delete is reflected in the current page, and reloading notes restores the service's fixture data.

## Design documents

- [REST API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture and capacity plan](docs/architecture.md)
- [Day 8: TicketHub ticketing design](day8/ticketing-design.md)
- [Day 8: Reflection](day8/reflection.md)

## What I learned

- How a reusable fetch helper, HTTP status handling and UI loading states make API interactions more predictable.
- How to build note elements safely with `textContent`, validate user input and keep asynchronous actions clear to users.
- How relational keys and constraints can enforce user ownership and note/tag relationships.
- How to estimate service load, separate asynchronous work with a queue, and reason about consistency and failover trade-offs.
