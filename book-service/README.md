# Book Service

This service provides CRUD operations for managing books.

## API Endpoints

### List Books
- **GET /books**
- Returns a list of all books

### Get Book by ID
- **GET /books/:id**
- Returns a specific book by ID

### Create Book
- **POST /books**
- Creates a new book
- Request Body:
  ```json
  {
    "title": "Book Title",
    "author": "Author Name",
    "publishedDate": "YYYY-MM-DD",
    "isbn": "ISBN Number"
  }
  ```

### Update Book
- **PUT /books/:id**
- Updates an existing book
- Request Body (all fields optional):
  ```json
  {
    "title": "New Title",
    "author": "New Author",
    "publishedDate": "YYYY-MM-DD",
    "isbn": "New ISBN"
  }
  ```

### Delete Book
- **DELETE /books/:id**
- Deletes a book by ID

### Search Books
- **GET /books/search?query=search_term**
- Searches for books by title or author

## Database Structure

The book service uses a PostgreSQL database with the following schema:

```sql
CREATE TABLE book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    published_date DATE,
    isbn TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running Tests

This service has two types of tests:

### Unit Tests

Unit tests directly call the API functions and mock any external dependencies. To run unit tests:

```bash
encore test book-service/book-service.test.ts
```

### API Tests

API tests make HTTP requests to the running service and test the complete API flow. To run API tests:

1. First, start the service:
   ```bash
   encore run
   ```

2. Then in another terminal, run:
   ```bash
   API_BASE_URL=http://localhost:4000 encore test book-service/api.test.ts
   ```

## Development

To add sample data to the database, run the application with:

```bash
encore run
```

The sample data from the migrations will be automatically added to the database. 