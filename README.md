# TransKnowledge

A personal knowledge management system for translators and interpreters to systematically build and manage specialized terminology, expressions, and contexts.

## Features

### Phase 1 MVP (Completed)
- ✅ Entry Management (CRUD operations)
- ✅ SQLite local database with full offline support
- ✅ Search and filter functionality
- ✅ Favorites system
- ✅ Data export (JSON, CSV, Plain Text)
- ✅ Bottom navigation
- ✅ Dark mode support

### Coming Soon
- Category management screen
- Graph visualization of relationships
- Google Drive backup/sync
- Tablet responsive design
- Data import functionality

## Tech Stack

- **Framework**: Flutter 3.x
- **Database**: SQLite (sqflite)
- **State Management**: Provider (ready to integrate)
- **Architecture**: Clean Architecture pattern

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── entry.dart           # Entry model with all fields
│   ├── relationship.dart    # Relationship model for graph
│   └── category.dart        # Category model
├── services/                # Business logic
│   ├── database_service.dart    # SQLite CRUD operations
│   └── export_service.dart      # Export to JSON/CSV/TXT
├── screens/                 # UI screens
│   ├── home_screen.dart           # Main entry list
│   ├── add_edit_entry_screen.dart # Create/edit entries
│   └── entry_detail_screen.dart   # View entry details
└── widgets/                 # Reusable UI components
```

## Database Schema

### Entries Table
- id, type, source_text, target_text
- source_language, target_language
- category, tags (comma-separated)
- pronunciation, context, notes
- difficulty_level, frequency
- source_reference, is_favorite
- created_at, updated_at

### Relationships Table
- id, from_entry_id, to_entry_id
- relationship_type (synonym, antonym, etc.)
- created_at

### Categories Table
- id, name, color, icon
- created_at

## Getting Started

### Prerequisites
- Flutter SDK 3.0+
- Dart SDK 3.0+
- Android Studio / VS Code

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MJ-best/my-words-note-flutter.git
cd my-words-note-flutter
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
flutter run
```

### Build

**Android APK:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

## Usage

1. **Add Entry**: Tap the + button on the home screen
2. **Search**: Use the search bar at the top
3. **Filter**: Tap the heart icon to show favorites only
4. **Export**: Tap the upload icon to export data
5. **Edit/Delete**: Tap an entry to view details, then use the toolbar

## Data Export

Export your data in multiple formats:
- **JSON**: Complete data structure with all relationships
- **CSV**: Spreadsheet-compatible format
- **Plain Text**: Simple text file organized by category

## Roadmap

See [instructions.md](instructions.md) for detailed development phases and priorities.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Min Jun (@MJ-best)
