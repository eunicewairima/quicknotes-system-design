# QuickNotes data model

QuickNotes uses a relational schema with four entities. UUIDs are used for externally visible identifiers, while foreign keys enforce ownership and referential integrity in PostgreSQL.

## Entities and relationships

- **users** stores one account per unique email address.
- **notes** stores each note and its owning user. A user can own many notes (one-to-many); each note belongs to one user.
- **tags** stores a user's reusable labels. A user can own many tags (one-to-many).
- **note_tags** associates notes with tags. A note can have many tags and a tag can label many notes (many-to-many); the join table's composite primary key prevents duplicate associations.

Tags belong to users, and a note may only be associated with tags owned by the same user. The API must validate this ownership rule in a transaction; the SQL foreign keys also prevent references to nonexistent rows.

## PostgreSQL schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name),
    UNIQUE (user_id, id)
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, id)
);

CREATE TABLE note_tags (
    note_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (user_id, note_id)
        REFERENCES notes(user_id, id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, tag_id)
        REFERENCES tags(user_id, id) ON DELETE CASCADE
);
```

The composite foreign keys on `note_tags` make cross-user tag assignments impossible at the database layer. `gen_random_uuid()` is provided by supported PostgreSQL versions; migrations should enable `pgcrypto` where required.

## Example queries

Fetch the newest notes belonging to one user:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

Fetch a note and its tags (JOIN):

```sql
SELECT n.id, n.title, n.body, t.id AS tag_id, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt
    ON nt.user_id = n.user_id AND nt.note_id = n.id
LEFT JOIN tags AS t
    ON t.user_id = nt.user_id AND t.id = nt.tag_id
WHERE n.user_id = $1 AND n.id = $2;
```

Count a user's notes by tag, including tags with no notes:

```sql
SELECT t.id, t.name, COUNT(nt.note_id) AS note_count
FROM tags AS t
LEFT JOIN note_tags AS nt
    ON nt.user_id = t.user_id AND nt.tag_id = t.id
WHERE t.user_id = $1
GROUP BY t.id, t.name
ORDER BY t.name;
```

Add an existing tag to an owned note without duplicating the association:

```sql
INSERT INTO note_tags (note_id, tag_id, user_id)
VALUES ($1, $2, $3)
ON CONFLICT (note_id, tag_id) DO NOTHING;
```

The API should run the last query only after confirming that the note and tag belong to the same authenticated user.

## Indexes

```sql
CREATE INDEX notes_user_created_idx
    ON notes (user_id, created_at DESC);

CREATE INDEX note_tags_user_tag_idx
    ON note_tags (user_id, tag_id, note_id);
```

`notes_user_created_idx` supports the common user's paginated newest-notes query without sorting every account's rows. `note_tags_user_tag_idx` supports looking up notes by a selected tag; the primary key already supports lookups by `(note_id, tag_id)`.

## SQL or NoSQL?

PostgreSQL is the better initial fit because users, notes, tags and their ownership relationships need transactions, uniqueness rules, foreign-key integrity and flexible joins. A managed relational database also supports read replicas and mature backup/recovery practices. If measured scale later makes some access patterns unsuitable for a single relational cluster, a cache or specialized search store can supplement PostgreSQL without weakening it as the source of truth.
