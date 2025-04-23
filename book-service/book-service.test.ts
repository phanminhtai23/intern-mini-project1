import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  searchBooks
} from './book-service';
import { db } from './db';

// Test book data
const testBook = {
  title: 'Test Book',
  author: 'Test Author',
  publishedDate: '2023-01-01',
  isbn: '1234567890123'
};

let createdBookId: string;

describe('Book Service API', () => {
  // Clean up test data after all tests
  afterAll(async () => {
    // Delete any remaining test books
    try {
      if (createdBookId) {
        await deleteBook({ id: createdBookId });
      }

      // Delete additional test books that might have been created
      const books = await listBooks();
      for (const book of books.books) {
        if (book.title.includes('Test Book')) {
          await deleteBook({ id: book.id });
        }
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  // Test creating a book
  it('should create a new book', async () => {
    const result = await createBook(testBook);

    expect(result).toBeDefined();
    expect(result.book).toBeDefined();
    expect(result.book.id).toBeDefined();
    expect(result.book.title).toBe(testBook.title);
    expect(result.book.author).toBe(testBook.author);
    expect(result.book.publishedDate).toBe(testBook.publishedDate);
    expect(result.book.isbn).toBe(testBook.isbn);

    // Save the ID for later tests
    createdBookId = result.book.id;
  });

  // Test listing all books
  it('should list all books', async () => {
    const result = await listBooks();

    expect(result).toBeDefined();
    expect(result.books).toBeDefined();
    expect(Array.isArray(result.books)).toBe(true);
    expect(result.books.length).toBeGreaterThan(0);

    // Check if our test book is in the list
    const foundBook = result.books.find(book => book.id === createdBookId);
    expect(foundBook).toBeDefined();
    expect(foundBook?.title).toBe(testBook.title);
  });

  // Test getting a book by ID
  it('should get a book by ID', async () => {
    const result = await getBook({ id: createdBookId });

    expect(result).toBeDefined();
    expect(result.book).toBeDefined();
    expect(result.book.id).toBe(createdBookId);
    expect(result.book.title).toBe(testBook.title);
    expect(result.book.author).toBe(testBook.author);
  });

  // Test getting a non-existent book
  it('should return 404 for non-existent book', async () => {
    try {
      await getBook({ id: '00000000-0000-0000-0000-000000000000' });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('not_found');
    }
  });

  // Test updating a book
  it('should update a book', async () => {
    const updatedData = {
      id: createdBookId,
      title: 'Updated Test Book',
      author: 'Updated Test Author'
    };

    const result = await updateBook(updatedData);

    expect(result).toBeDefined();
    expect(result.book).toBeDefined();
    expect(result.book.id).toBe(createdBookId);
    expect(result.book.title).toBe(updatedData.title);
    expect(result.book.author).toBe(updatedData.author);
    // These fields should not change
    expect(result.book.publishedDate).toBe(testBook.publishedDate);
    expect(result.book.isbn).toBe(testBook.isbn);
  });

  // Test searching for books
  it('should search for books by title or author', async () => {
    // Search by updated title
    let result = await searchBooks({ query: 'Updated Test' });

    expect(result).toBeDefined();
    expect(result.books).toBeDefined();
    expect(Array.isArray(result.books)).toBe(true);
    expect(result.books.length).toBeGreaterThan(0);

    const foundByTitle = result.books.find(book => book.id === createdBookId);
    expect(foundByTitle).toBeDefined();

    // Search by author
    result = await searchBooks({ query: 'Updated Test Author' });

    expect(result.books.length).toBeGreaterThan(0);
    const foundByAuthor = result.books.find(book => book.id === createdBookId);
    expect(foundByAuthor).toBeDefined();
  });

  // Test deletion of a book
  it('should delete a book', async () => {
    const result = await deleteBook({ id: createdBookId });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Try to get the deleted book, should throw 404
    try {
      await getBook({ id: createdBookId });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('not_found');
    }
  });

  // Test creating a book with duplicate ISBN
  it('should not create a book with duplicate ISBN', async () => {
    // First create a book
    const book1 = await createBook({
      title: 'Test Book 1',
      author: 'Test Author 1',
      isbn: '9876543210123'
    });

    try {
      // Try to create another book with the same ISBN
      await createBook({
        title: 'Test Book 2',
        author: 'Test Author 2',
        isbn: '9876543210123'
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('already_exists');
    } finally {
      // Clean up the created book
      if (book1 && book1.book) {
        await deleteBook({ id: book1.book.id });
      }
    }
  });
});

