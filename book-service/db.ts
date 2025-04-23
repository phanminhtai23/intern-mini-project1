import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create database instance
export const db = new SQLDatabase("book-service", {
    migrations: "./migrations",
}); 