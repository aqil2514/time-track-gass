// backend/tests/testutils/screenshots.go
package testutils

import (
	"os"
	"path/filepath"
)

const TestDataDir = "tests/testdata/screenshots"

// Test screenshot file constants (PNG files as they exist)
const (
	ScreenshotCoding        = "coding_vscode.png"
	ScreenshotMeeting       = "meeting_zoom.png"
	ScreenshotBrowsing      = "browsing_chrome.png"
	ScreenshotDocumentation = "documentation_notion.png"
	ScreenshotEmpty         = "empty_desktop.png"
)

// Edge case file constants (generated programmatically)
const (
	ScreenshotInvalid  = "invalid_format.txt"
	ScreenshotTooLarge = "too_large.png"
	ScreenshotCorrupt  = "corrupted.png"
)

// GetTestScreenshot returns the path to a test screenshot
func GetTestScreenshot(name string) string {
	return filepath.Join(TestDataDir, name)
}

// GetTestScreenshotBytes returns the content of a test screenshot
func GetTestScreenshotBytes(name string) ([]byte, error) {
	return os.ReadFile(GetTestScreenshot(name))
}

// HasTestScreenshot checks if a test screenshot exists
func HasTestScreenshot(name string) bool {
	info, err := os.Stat(GetTestScreenshot(name))
	return err == nil && !info.IsDir()
}
