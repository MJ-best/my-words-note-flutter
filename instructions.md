# TransKnowledge Development Instructions

## Project Overview
This is a Flutter-based personal knowledge management app for translators and interpreters to build and manage specialized terminology with relationship visualization.

## Current Status
**Empty repository** - Starting from scratch

## Development Phases

### Phase 1: MVP (Current Focus)
Build the foundation with these core features:

1. **Project Setup**
   - Initialize Flutter project structure
   - Set up dependencies (sqflite, provider, uuid, path_provider, file_picker, share_plus, csv)
   - Create folder structure: lib/{models, screens, widgets, services, utils}
   - Configure Android/iOS minimum versions

2. **Database Layer**
   - Implement SQLite schema with 3 tables: entries, relationships, categories
   - Create database helper/service class
   - Implement CRUD operations for entries
   - Add indexing for search performance

3. **Core Models**
   - Entry model (id, type, source_text, target_text, languages, category, tags, etc.)
   - Relationship model (id, from_entry_id, to_entry_id, relationship_type)
   - Category model (id, name, color, icon)

4. **Basic UI Screens**
   - Home screen with entry list and search bar
   - Entry detail/edit screen with all fields
   - Add new entry screen
   - Category management screen
   - Settings screen (basic)
   - Bottom navigation (Home, Categories, Graph placeholder, Settings)

5. **Search & Filter**
   - Full-text search across entries
   - Filter by category
   - Filter by tags
   - Recent items view
   - Favorites toggle

6. **Data Export**
   - Export to JSON (complete data structure)
   - Export to CSV (tabular format)
   - Export all or filtered entries
   - Save to device storage
   - Share functionality

### Phase 2: Core Features (Next)
1. **Graph Visualization**
   - Implement relationship graph using graphview package
   - Interactive node selection and navigation
   - Multiple relationship types (synonym, antonym, related, etc.)
   - Zoom and pan gestures

2. **Google Drive Backup**
   - Google Sign-In integration
   - Manual backup to Drive
   - Restore from Drive
   - Automatic backup scheduling

3. **Responsive Design**
   - Tablet layout (master-detail pattern)
   - Landscape mode optimization

4. **Markdown Export**
   - Structured markdown with category sections
   - Internal links between entries

### Phase 3: Advanced Features (Later)
- Advanced filters and search
- Data import from JSON/CSV
- Merge/sync logic for multiple devices
- Enhanced graph interactions
- Theming and customization

### Phase 4: Polish (Final)
- Performance optimization
- Bug fixes
- Multi-language support
- User guide/tutorial
- Store preparation

## Key Technical Decisions

**Database**: SQLite (sqflite package) - proven, fast, offline-first
**State Management**: Provider (simple, sufficient for this app)
**Architecture**: Clean architecture with separation of concerns

## Data Structure

### Entry Table
```sql
id TEXT PRIMARY KEY
type TEXT (word/phrase/term/expression)
source_text TEXT NOT NULL
target_text TEXT NOT NULL
source_language TEXT
target_language TEXT
category TEXT
tags TEXT (JSON array)
pronunciation TEXT
context TEXT
notes TEXT
difficulty_level INTEGER
frequency INTEGER
source_reference TEXT
is_favorite INTEGER (0/1)
created_at TEXT
updated_at TEXT
```

### Relationship Table
```sql
id TEXT PRIMARY KEY
from_entry_id TEXT
to_entry_id TEXT
relationship_type TEXT
created_at TEXT
```

### Category Table
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
color TEXT
icon TEXT
created_at TEXT
```

## What to Do Now

**Immediate Next Steps:**
1. Initialize Flutter project with `flutter create .` in the repo directory
2. Update pubspec.yaml with required dependencies
3. Create folder structure under lib/
4. Implement database service and models (Phase 1, steps 2-3)
5. Build basic home screen with entry list (Phase 1, step 4)
6. Implement add/edit entry functionality
7. Add search and basic filters
8. Implement export features (JSON, CSV)

## Development Guidelines
- Use **offline-first** approach - everything works without internet
- **Auto-save** all data immediately
- Keep UI **simple and intuitive** - max 3 taps to add entry
- Follow **Material Design** principles
- Write **clean, documented code**
- Test on both Android and iOS
- Support **dark mode** from the start

## When Implementing Features
1. Always start with data layer (models, database)
2. Then build service/business logic
3. Finally create UI screens
4. Test thoroughly before moving to next feature

## Current Priority
**Start with Phase 1, Step 1**: Initialize the Flutter project and set up the basic structure.
