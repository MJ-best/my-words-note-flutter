# TransKnowledge Development Instructions

## Project Overview
This is a Flutter-based personal knowledge management app for translators and interpreters to build and manage specialized terminology with relationship visualization.

## Current Status
**Phase 1 Complete + Phase 2 Partial** - MVP ready with additional features

### ✅ Completed Features
- Full entry management (CRUD)
- SQLite database with indexing
- Category management with colors and icons
- Settings screen with statistics
- Markdown export (structured with TOC and relationships)
- Search, filter, and favorites
- Multi-format export (JSON, CSV, TXT, MD)
- Dark mode support

### 🚧 In Progress
- Graph visualization (next priority)

## Development Phases

### Phase 1: MVP ✅ COMPLETE
All features implemented:

1. **Project Setup** ✅
   - Flutter project structure initialized
   - Dependencies configured (sqflite, provider, uuid, path_provider, file_picker, share_plus, csv)
   - Folder structure created: lib/{models, screens, widgets, services}
   - Material 3 design system

2. **Database Layer** ✅
   - SQLite schema with 3 tables: entries, relationships, categories
   - Database service class with full CRUD operations
   - Search indexing for performance
   - Statistics queries

3. **Core Models** ✅
   - Entry model with 16 fields (complete PRD compliance)
   - Relationship model with 6 relationship types
   - Category model with color and icon support

4. **Basic UI Screens** ✅
   - Home screen with entry list and search bar
   - Entry detail screen with full information display
   - Add/Edit entry screen with all fields
   - Category management screen (CRUD with visual customization)
   - Settings screen (statistics, data management, app info)
   - Bottom navigation (Home, Categories, Graph placeholder, Settings)

5. **Search & Filter** ✅
   - Full-text search across source/target text and notes
   - Filter by favorites
   - Real-time search updates
   - Entry count display

6. **Data Export** ✅
   - Export to JSON (complete data structure with relationships)
   - Export to CSV (tabular format)
   - Export to Plain Text (category-organized)
   - Export to Markdown (structured with TOC, internal links, relationships)
   - Share functionality via system share sheet

### Phase 2: Core Features (Partially Complete)
1. **Graph Visualization** 🚧 IN PROGRESS
   - Implement relationship graph using graphview package
   - Interactive node selection and navigation
   - Multiple relationship types (synonym, antonym, related, etc.)
   - Zoom and pan gestures

2. **Google Drive Backup** ⏳ PENDING
   - Google Sign-In integration
   - Manual backup to Drive
   - Restore from Drive
   - Automatic backup scheduling

3. **Responsive Design** ⏳ PENDING
   - Tablet layout (master-detail pattern)
   - Landscape mode optimization

4. **Markdown Export** ✅ COMPLETE
   - Structured markdown with category sections
   - Table of contents with category links
   - Internal links between entries via relationships
   - Collapsible metadata sections
   - Entry anchors for navigation

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

**Next Priority: Graph Visualization (Phase 2.1)**

**Immediate Next Steps:**
1. Add graphview package to pubspec.yaml
2. Create graph_screen.dart with relationship visualization
3. Implement node/edge rendering for entries and relationships
4. Add zoom and pan gestures
5. Enable node selection and navigation to entry details
6. Update main.dart to use GraphScreen instead of placeholder

**After Graph Visualization:**
- Google Drive backup integration
- Responsive tablet layout
- Data import from JSON/CSV

## Implementation Notes

### Files Structure
```
lib/
├── main.dart                      # App entry with bottom navigation
├── models/                        # Data models
│   ├── entry.dart                # ✅ Complete with 16 fields
│   ├── relationship.dart         # ✅ 6 relationship types
│   └── category.dart             # ✅ Color/icon support
├── services/                      # Business logic
│   ├── database_service.dart     # ✅ Full CRUD + search
│   └── export_service.dart       # ✅ JSON/CSV/TXT/MD export
├── screens/                       # UI screens
│   ├── home_screen.dart          # ✅ Entry list + search
│   ├── add_edit_entry_screen.dart # ✅ Full form
│   ├── entry_detail_screen.dart  # ✅ Complete details
│   ├── categories_screen.dart    # ✅ Category management
│   ├── settings_screen.dart      # ✅ Stats + data management
│   └── graph_screen.dart         # 🚧 To be implemented
└── widgets/                       # Reusable components
```

### Key Features Implemented
- **Entry Management**: Full CRUD with 16 fields per PRD
- **Category System**: Visual customization with 10 colors and 11 icons
- **Export Formats**: JSON (complete), CSV (tabular), TXT (organized), MD (structured with TOC and links)
- **Search**: Real-time full-text search across source/target/notes
- **Database**: SQLite with proper indexing for performance
- **UI**: Material 3 design with dark mode support

### Statistics (Current Implementation)
- Total lines of code: ~2,500+
- Models: 3 (Entry, Relationship, Category)
- Services: 2 (Database, Export)
- Screens: 6 (Home, Add/Edit Entry, Entry Detail, Categories, Settings, + Graph placeholder)
- Database tables: 3 with 6 indexes

## Development Guidelines
- Use **offline-first** approach - everything works without internet ✅
- **Auto-save** all data immediately ✅
- Keep UI **simple and intuitive** - max 3 taps to add entry ✅
- Follow **Material Design** principles ✅
- Write **clean, documented code** ✅
- Test on both Android and iOS
- Support **dark mode** from the start ✅

## When Implementing Features
1. Always start with data layer (models, database) ✅
2. Then build service/business logic ✅
3. Finally create UI screens ✅
4. Test thoroughly before moving to next feature

## Current Priority
**Implement Graph Visualization (Phase 2.1)**: Create interactive relationship graph to visualize connections between entries.
