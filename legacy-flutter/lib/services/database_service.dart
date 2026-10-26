import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/entry.dart';
import '../models/relationship.dart';
import '../models/category.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  static Database? _database;

  DatabaseService._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('transknowledge.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Create entries table
    await db.execute('''
      CREATE TABLE entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source_text TEXT NOT NULL,
        target_text TEXT NOT NULL,
        source_language TEXT NOT NULL,
        target_language TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT,
        pronunciation TEXT,
        context TEXT,
        notes TEXT,
        difficulty_level INTEGER,
        frequency INTEGER,
        source_reference TEXT,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    // Create relationships table
    await db.execute('''
      CREATE TABLE relationships (
        id TEXT PRIMARY KEY,
        from_entry_id TEXT NOT NULL,
        to_entry_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (from_entry_id) REFERENCES entries (id) ON DELETE CASCADE,
        FOREIGN KEY (to_entry_id) REFERENCES entries (id) ON DELETE CASCADE
      )
    ''');

    // Create categories table
    await db.execute('''
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    ''');

    // Create indexes for better search performance
    await db.execute(
        'CREATE INDEX idx_entries_source_text ON entries(source_text)');
    await db.execute(
        'CREATE INDEX idx_entries_target_text ON entries(target_text)');
    await db.execute('CREATE INDEX idx_entries_category ON entries(category)');
    await db.execute(
        'CREATE INDEX idx_entries_is_favorite ON entries(is_favorite)');
    await db.execute(
        'CREATE INDEX idx_relationships_from ON relationships(from_entry_id)');
    await db.execute(
        'CREATE INDEX idx_relationships_to ON relationships(to_entry_id)');
  }

  // ==================== Entry CRUD Operations ====================

  Future<String> createEntry(Entry entry) async {
    final db = await database;
    await db.insert('entries', entry.toMap());
    return entry.id;
  }

  Future<Entry?> getEntry(String id) async {
    final db = await database;
    final maps = await db.query(
      'entries',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return Entry.fromMap(maps.first);
    }
    return null;
  }

  Future<List<Entry>> getAllEntries() async {
    final db = await database;
    final maps = await db.query('entries', orderBy: 'updated_at DESC');
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<List<Entry>> getRecentEntries({int limit = 20}) async {
    final db = await database;
    final maps = await db.query(
      'entries',
      orderBy: 'updated_at DESC',
      limit: limit,
    );
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<List<Entry>> getFavoriteEntries() async {
    final db = await database;
    final maps = await db.query(
      'entries',
      where: 'is_favorite = ?',
      whereArgs: [1],
      orderBy: 'updated_at DESC',
    );
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<List<Entry>> getEntriesByCategory(String category) async {
    final db = await database;
    final maps = await db.query(
      'entries',
      where: 'category = ?',
      whereArgs: [category],
      orderBy: 'updated_at DESC',
    );
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<List<Entry>> searchEntries(String query) async {
    final db = await database;
    final maps = await db.query(
      'entries',
      where: 'source_text LIKE ? OR target_text LIKE ? OR notes LIKE ?',
      whereArgs: ['%$query%', '%$query%', '%$query%'],
      orderBy: 'updated_at DESC',
    );
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<int> updateEntry(Entry entry) async {
    final db = await database;
    return await db.update(
      'entries',
      entry.toMap(),
      where: 'id = ?',
      whereArgs: [entry.id],
    );
  }

  Future<int> deleteEntry(String id) async {
    final db = await database;
    // Delete related relationships first
    await db.delete(
      'relationships',
      where: 'from_entry_id = ? OR to_entry_id = ?',
      whereArgs: [id, id],
    );
    // Delete the entry
    return await db.delete(
      'entries',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ==================== Relationship CRUD Operations ====================

  Future<String> createRelationship(Relationship relationship) async {
    final db = await database;
    await db.insert('relationships', relationship.toMap());
    return relationship.id;
  }

  Future<List<Relationship>> getRelationshipsForEntry(String entryId) async {
    final db = await database;
    final maps = await db.query(
      'relationships',
      where: 'from_entry_id = ? OR to_entry_id = ?',
      whereArgs: [entryId, entryId],
    );
    return maps.map((map) => Relationship.fromMap(map)).toList();
  }

  Future<List<Relationship>> getAllRelationships() async {
    final db = await database;
    final maps = await db.query('relationships');
    return maps.map((map) => Relationship.fromMap(map)).toList();
  }

  Future<int> deleteRelationship(String id) async {
    final db = await database;
    return await db.delete(
      'relationships',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ==================== Category CRUD Operations ====================

  Future<String> createCategory(Category category) async {
    final db = await database;
    await db.insert('categories', category.toMap());
    return category.id;
  }

  Future<Category?> getCategory(String id) async {
    final db = await database;
    final maps = await db.query(
      'categories',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return Category.fromMap(maps.first);
    }
    return null;
  }

  Future<List<Category>> getAllCategories() async {
    final db = await database;
    final maps = await db.query('categories', orderBy: 'name ASC');
    return maps.map((map) => Category.fromMap(map)).toList();
  }

  Future<int> updateCategory(Category category) async {
    final db = await database;
    return await db.update(
      'categories',
      category.toMap(),
      where: 'id = ?',
      whereArgs: [category.id],
    );
  }

  Future<int> deleteCategory(String id) async {
    final db = await database;
    return await db.delete(
      'categories',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ==================== Statistics ====================

  Future<int> getEntriesCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM entries');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> getCategoriesCount() async {
    final db = await database;
    final result =
        await db.rawQuery('SELECT COUNT(*) as count FROM categories');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> getRelationshipsCount() async {
    final db = await database;
    final result =
        await db.rawQuery('SELECT COUNT(*) as count FROM relationships');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // ==================== Utility ====================

  Future<void> close() async {
    final db = await database;
    db.close();
  }

  Future<void> deleteDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'transknowledge.db');
    await databaseFactory.deleteDatabase(path);
    _database = null;
  }
}
