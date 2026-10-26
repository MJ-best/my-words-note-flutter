# TransKnowledge

A personal knowledge management system for translators and interpreters to systematically build and manage specialized terminology, expressions, and contexts.

## Features

### Phase 1 MVP ✅ (Completed)
- ✅ Entry Management (CRUD operations with 16 fields)
- ✅ SQLite local database with full offline support
- ✅ Search and filter functionality (full-text search)
- ✅ Favorites system
- ✅ Category management with visual customization (10 colors, 11 icons)
- ✅ Settings screen (statistics, data management, app info)
- ✅ Data export (JSON, CSV, Plain Text, **Markdown**)
- ✅ Bottom navigation
- ✅ Dark mode support

### Phase 2 (Partial) ✅
- ✅ **Markdown Export** - Structured format with table of contents and internal links

### Coming Soon
- 🚧 Graph visualization of relationships (in progress)
- ⏳ Google Drive backup/sync
- ⏳ Tablet responsive design
- ⏳ Data import functionality

## Tech Stack

- **Framework**: Flutter 3.x
- **Database**: SQLite (sqflite)
- **State Management**: Provider (ready to integrate)
- **Architecture**: Clean Architecture pattern

## Project Structure

```
lib/
├── main.dart                      # App entry with bottom navigation
├── models/                        # Data models
│   ├── entry.dart                # Entry model (16 fields)
│   ├── relationship.dart         # Relationship model (6 types)
│   └── category.dart             # Category model with color/icon
├── services/                      # Business logic
│   ├── database_service.dart     # SQLite CRUD + search + stats
│   └── export_service.dart       # Export JSON/CSV/TXT/MD
├── screens/                       # UI screens
│   ├── home_screen.dart          # Entry list + search + export
│   ├── add_edit_entry_screen.dart # Create/edit entries (full form)
│   ├── entry_detail_screen.dart  # View entry details
│   ├── categories_screen.dart    # Category management
│   └── settings_screen.dart      # Statistics + app info
└── widgets/                       # Reusable UI components
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

### Home Screen
1. **Add Entry**: Tap the + button to create a new entry
2. **Search**: Use the search bar for full-text search
3. **Filter**: Tap the heart icon to show favorites only
4. **Export**: Tap the upload icon to choose export format
5. **View Details**: Tap any entry to see full information

### Categories Screen
1. **Add Category**: Tap the + button
2. **Customize**: Choose from 10 colors and 11 icons
3. **Manage**: Edit or delete categories (with entry count protection)

### Settings Screen
- View statistics (entries, categories, relationships)
- Refresh data
- Clear all data (with double confirmation)
- App information and license

## Data Export

Export your data in 4 formats:

- **JSON**: Complete data structure with entries, relationships, and categories (ideal for backup/restore)
- **CSV**: Spreadsheet-compatible tabular format (for Excel/Google Sheets)
- **Plain Text**: Simple, readable format organized by category
- **Markdown**: Beautifully formatted with table of contents, internal links, and collapsible metadata (great for documentation)

## Roadmap

See [instructions.md](instructions.md) for detailed development phases and priorities.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Min Jun (@MJ-best)
