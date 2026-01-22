// backend/tests/testutils/db.go
package testutils

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectTestDB connects to the test database
func ConnectTestDB() *pgxpool.Pool {
	connStr := os.Getenv("TEST_DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5433/timetrack_test?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to test database: %v", err))
	}

	// Verify connection
	if err := pool.Ping(context.Background()); err != nil {
		panic(fmt.Sprintf("failed to ping test database: %v", err))
	}

	return pool
}

// CleanupTestDB truncates all test data from the database
func CleanupTestDB(ctx context.Context, db *pgxpool.Pool) error {
	tables := []string{
		"daily_summaries",
		"notifications",
		"shared_links",
		"shares",
		"activities",
		"sessions",
		"users",
		"organizations",
	}

	for _, table := range tables {
		if _, err := db.Exec(ctx, fmt.Sprintf("DELETE FROM %s", table)); err != nil {
			return fmt.Errorf("failed to cleanup table %s: %w", table, err)
		}
	}

	return nil
}
