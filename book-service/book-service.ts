import { api } from "encore.dev/api";
import { APIError, ErrCode } from "encore.dev/api";
import { db } from "./db";

// Book Type
export type Book = {
  id: string;
  title: string;
  author: string;
  publishedDate?: string;
  isbn?: string;
};

// Result type for database operations
type DBResult = {
  rowsAffected?: number;
};

// GET /books - List all books
export const listBooks = api(
  { expose: true, method: "GET", path: "/books" },
  async (): Promise<{ books: Book[] }> => {
    const books: Book[] = [];
    const rows = await db.query<Book>`
      SELECT id, title, author, 
             published_date AS "publishedDate", 
             isbn
      FROM book
      ORDER BY title ASC
    `;

    for await (const book of rows) {
      books.push(book);
    }

    return { books };
  }
);

// GET /books/:id - Get a specific book by ID
export const getBook = api(
  { expose: true, method: "GET", path: "/books/:id" },
  async ({ id }: { id: string }): Promise<{ book: Book }> => {
    const book = await db.queryRow<Book>`
      SELECT id, title, author, 
             published_date AS "publishedDate", 
             isbn
      FROM book
      WHERE id = ${id}
    `;

    if (!book) {
      throw new APIError(ErrCode.NotFound, `Book with ID ${id} not found`);
    }

    return { book };
  }
);

// POST /books - Create a new book
interface CreateBookParams {
  title: string;
  author: string;
  publishedDate?: string;
  isbn?: string;
}

export const createBook = api(
  { expose: true, method: "POST", path: "/books" },
  async (params: CreateBookParams): Promise<{ book: Book }> => {
    try {
      const result = await db.queryRow<Book>`
        INSERT INTO book (title, author, published_date, isbn)
        VALUES (${params.title}, ${params.author}, ${params.publishedDate}, ${params.isbn})
        RETURNING id, title, author, published_date AS "publishedDate", isbn
      `;

      if (!result) {
        throw new APIError(ErrCode.Internal, "Failed to create book");
      }

      return { book: result };
    } catch (err: any) {
      if (err.message?.includes('duplicate key')) {
        throw new APIError(ErrCode.AlreadyExists, "A book with this ISBN already exists");
      }
      throw err;
    }
  }
);

// PUT /books/:id - Update a book
interface UpdateBookParams {
  id: string;
  title?: string;
  author?: string;
  publishedDate?: string;
  isbn?: string;
}

export const updateBook = api(
  { expose: true, method: "PUT", path: "/books/:id" },
  async (params: UpdateBookParams): Promise<{ book: Book }> => {
    // First check if the book exists
    const exists = await db.queryRow`
      SELECT 1 FROM book WHERE id = ${params.id}
    `;

    if (!exists) {
      throw new APIError(ErrCode.NotFound, `Book with ID ${params.id} not found`);
    }

    try {
      // Build update query dynamically based on provided fields
      let updates = [];
      let values = [];

      if (params.title !== undefined) {
        updates.push("title = $" + (values.length + 1));
        values.push(params.title);
      }

      if (params.author !== undefined) {
        updates.push("author = $" + (values.length + 1));
        values.push(params.author);
      }

      if (params.publishedDate !== undefined) {
        updates.push("published_date = $" + (values.length + 1));
        values.push(params.publishedDate);
      }

      if (params.isbn !== undefined) {
        updates.push("isbn = $" + (values.length + 1));
        values.push(params.isbn);
      }

      // Always update the updated_at timestamp
      updates.push("updated_at = CURRENT_TIMESTAMP");

      if (updates.length === 1 && updates[0] === "updated_at = CURRENT_TIMESTAMP") {
        // No actual fields to update were provided
        throw new APIError(ErrCode.InvalidArgument, "No fields to update were provided");
      }

      // Perform the update
      // Use tagged template literals instead of custom query
      const updateClause = updates.join(', ');
      const book = await db.queryRow<Book>`
        UPDATE book
        SET ${updateClause}
        WHERE id = ${params.id}
        RETURNING id, title, author, published_date AS "publishedDate", isbn
      `;

      if (!book) {
        throw new APIError(ErrCode.Internal, "Failed to update book");
      }

      return { book };
    } catch (err: any) {
      if (err.message?.includes('duplicate key')) {
        throw new APIError(ErrCode.AlreadyExists, "A book with this ISBN already exists");
      }
      throw err;
    }
  }
);

// DELETE /books/:id - Delete a book
export const deleteBook = api(
  { expose: true, method: "DELETE", path: "/books/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    // Need to check affected rows manually
    await db.exec`
      DELETE FROM book
      WHERE id = ${id}
    `;

    // Check if the book was deleted by trying to fetch it
    const stillExists = await db.queryRow`
      SELECT 1 FROM book WHERE id = ${id}
    `;

    if (stillExists) {
      throw new APIError(ErrCode.NotFound, `Book with ID ${id} not found`);
    }

    return { success: true };
  }
);

// SEARCH /books/search - Search books by title or author
export const searchBooks = api(
  { expose: true, method: "GET", path: "/books/search" },
  async ({ query }: { query: string }): Promise<{ books: Book[] }> => {
    const books: Book[] = [];
    const searchPattern = `%${query}%`;

    const rows = await db.query<Book>`
      SELECT id, title, author, 
             published_date AS "publishedDate", 
             isbn
      FROM book
      WHERE 
        title ILIKE ${searchPattern} OR
        author ILIKE ${searchPattern}
      ORDER BY title ASC
    `;

    for await (const book of rows) {
      books.push(book);
    }

    return { books };
  }
);
