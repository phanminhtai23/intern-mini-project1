import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';

// Configure the base URL for API calls
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

// Test book data
const testBook = {
    title: 'API Test Book',
    author: 'API Test Author',
    publishedDate: '2023-01-01',
    isbn: '0987654321098'
};

let createdBookId: string;

describe('Book Service API via HTTP', () => {
    // Clean up test data after all tests
    afterAll(async () => {
        if (createdBookId) {
            await fetch(`${API_BASE_URL}/books/${createdBookId}`, {
                method: 'DELETE'
            });
        }
    });

    // Test creating a book
    it('should create a new book', async () => {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBook)
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toBeDefined();
        expect(data.book).toBeDefined();
        expect(data.book.id).toBeDefined();
        expect(data.book.title).toBe(testBook.title);
        expect(data.book.author).toBe(testBook.author);

        // Save the ID for later tests
        createdBookId = data.book.id;
    });

    // Test listing all books
    it('should list all books', async () => {
        const response = await fetch(`${API_BASE_URL}/books`);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toBeDefined();
        expect(data.books).toBeDefined();
        expect(Array.isArray(data.books)).toBe(true);
        expect(data.books.length).toBeGreaterThan(0);

        // Check if our test book is in the list
        const foundBook = data.books.find((book: any) => book.id === createdBookId);
        expect(foundBook).toBeDefined();
        expect(foundBook.title).toBe(testBook.title);
    });

    // Test getting a book by ID
    it('should get a book by ID', async () => {
        const response = await fetch(`${API_BASE_URL}/books/${createdBookId}`);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toBeDefined();
        expect(data.book).toBeDefined();
        expect(data.book.id).toBe(createdBookId);
        expect(data.book.title).toBe(testBook.title);
        expect(data.book.author).toBe(testBook.author);
    });

    // Test getting a non-existent book
    it('should return 404 for non-existent book', async () => {
        const response = await fetch(`${API_BASE_URL}/books/00000000-0000-0000-0000-000000000000`);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.code).toBe('not_found');
    });

    // Test updating a book
    it('should update a book', async () => {
        const updatedData = {
            title: 'Updated API Test Book',
            author: 'Updated API Test Author'
        };

        const response = await fetch(`${API_BASE_URL}/books/${createdBookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toBeDefined();
        expect(data.book).toBeDefined();
        expect(data.book.id).toBe(createdBookId);
        expect(data.book.title).toBe(updatedData.title);
        expect(data.book.author).toBe(updatedData.author);
    });

    // Test searching for books
    it('should search for books by title or author', async () => {
        // Search by title
        let response = await fetch(`${API_BASE_URL}/books/search?query=Updated API Test`);

        expect(response.status).toBe(200);
        let data = await response.json();

        expect(data).toBeDefined();
        expect(data.books).toBeDefined();
        expect(Array.isArray(data.books)).toBe(true);
        expect(data.books.length).toBeGreaterThan(0);

        const foundByTitle = data.books.find((book: any) => book.id === createdBookId);
        expect(foundByTitle).toBeDefined();

        // Search by author
        response = await fetch(`${API_BASE_URL}/books/search?query=Updated API Test Author`);

        expect(response.status).toBe(200);
        data = await response.json();

        expect(data.books.length).toBeGreaterThan(0);
        const foundByAuthor = data.books.find((book: any) => book.id === createdBookId);
        expect(foundByAuthor).toBeDefined();
    });

    // Test deletion of a book
    it('should delete a book', async () => {
        const response = await fetch(`${API_BASE_URL}/books/${createdBookId}`, {
            method: 'DELETE'
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toBeDefined();
        expect(data.success).toBe(true);

        // Try to get the deleted book, should return 404
        const getResponse = await fetch(`${API_BASE_URL}/books/${createdBookId}`);
        expect(getResponse.status).toBe(404);
    });

    // Test creating a book with duplicate ISBN
    it('should not create a book with duplicate ISBN', async () => {
        // First create a book
        const createResponse1 = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Duplicate ISBN Test Book 1',
                author: 'Duplicate ISBN Test Author 1',
                isbn: '1111222233334444'
            })
        });

        expect(createResponse1.status).toBe(200);
        const book1 = await createResponse1.json();

        // Try to create another book with the same ISBN
        const createResponse2 = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Duplicate ISBN Test Book 2',
                author: 'Duplicate ISBN Test Author 2',
                isbn: '1111222233334444'
            })
        });

        expect(createResponse2.status).toBe(409); // Conflict status code
        const errorData = await createResponse2.json();
        expect(errorData.code).toBe('already_exists');

        // Clean up the created book
        if (book1 && book1.book && book1.book.id) {
            await fetch(`${API_BASE_URL}/books/${book1.book.id}`, {
                method: 'DELETE'
            });
        }
    });
}); 