// backend/seeds/001_default_user.go
package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Database connection
	dsn := "host=localhost user=timetrack password=timetrack123 dbname=timetrack port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Hash password
	password := "Kerja123!"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	// Insert default user
	sql := `INSERT INTO users (email, password_hash, name, created_at, updated_at)
			VALUES ($1, $2, $3, NOW(), NOW())
			ON CONFLICT (email) DO NOTHING`

	result := db.Exec(sql, "pile@timetrack.local", string(hashedPassword), "Pile")
	if result.Error != nil {
		log.Fatal("Failed to insert user:", result.Error)
	}

	fmt.Println("✅ Default user created successfully!")
	fmt.Println("Email: pile@timetrack.local")
	fmt.Println("Password: Kerja123!")
}
