import '../models/entry.dart';
import '../models/relationship.dart';
import '../models/category.dart';
import '../services/database_service.dart';

/// Repository pattern to decouple business logic from data layer
/// Provides caching and optimized data access
class EntryRepository {
  final DatabaseService _db;

  // Cache layer
  List<Entry>? _cachedEntries;
  List<Category>? _cachedCategories;
  DateTime? _lastCacheUpdate;
  static const _cacheValidDuration = Duration(minutes: 5);

  EntryRepository({DatabaseService? databaseService})
      : _db = databaseService ?? DatabaseService.instance;

  // Clear cache
  void clearCache() {
    _cachedEntries = null;
    _cachedCategories = null;
    _lastCacheUpdate = null;
  }

  // Check if cache is valid
  bool get _isCacheValid {
    if (_lastCacheUpdate == null) return false;
    return DateTime.now().difference(_lastCacheUpdate!) < _cacheValidDuration;
  }

  // ==================== Entry Operations ====================

  Future<List<Entry>> getAllEntries({bool forceRefresh = false}) async {
    if (!forceRefresh && _isCacheValid && _cachedEntries != null) {
      return _cachedEntries!;
    }

    final entries = await _db.getAllEntries();
    _cachedEntries = entries;
    _lastCacheUpdate = DateTime.now();
    return entries;
  }

  Future<List<Entry>> getEntriesPaginated({
    required int offset,
    required int limit,
  }) async {
    final db = await _db.database;
    final maps = await db.query(
      'entries',
      orderBy: 'updated_at DESC',
      limit: limit,
      offset: offset,
    );
    return maps.map((map) => Entry.fromMap(map)).toList();
  }

  Future<int> getEntriesCount() async {
    return await _db.getEntriesCount();
  }

  Future<List<Entry>> searchEntries(String query) async {
    return await _db.searchEntries(query);
  }

  Future<List<Entry>> getFavoriteEntries() async {
    return await _db.getFavoriteEntries();
  }

  Future<List<Entry>> getEntriesByCategory(String category) async {
    return await _db.getEntriesByCategory(category);
  }

  Future<Entry?> getEntry(String id) async {
    return await _db.getEntry(id);
  }

  Future<String> createEntry(Entry entry) async {
    final id = await _db.createEntry(entry);
    clearCache(); // Invalidate cache
    return id;
  }

  Future<int> updateEntry(Entry entry) async {
    final result = await _db.updateEntry(entry);
    clearCache(); // Invalidate cache
    return result;
  }

  Future<int> deleteEntry(String id) async {
    final result = await _db.deleteEntry(id);
    clearCache(); // Invalidate cache
    return result;
  }

  // ==================== Relationship Operations ====================

  Future<List<Relationship>> getRelationshipsForEntry(String entryId) async {
    return await _db.getRelationshipsForEntry(entryId);
  }

  Future<List<Relationship>> getAllRelationships() async {
    return await _db.getAllRelationships();
  }

  Future<String> createRelationship(Relationship relationship) async {
    return await _db.createRelationship(relationship);
  }

  Future<int> deleteRelationship(String id) async {
    return await _db.deleteRelationship(id);
  }

  // ==================== Category Operations ====================

  Future<List<Category>> getAllCategories({bool forceRefresh = false}) async {
    if (!forceRefresh && _isCacheValid && _cachedCategories != null) {
      return _cachedCategories!;
    }

    final categories = await _db.getAllCategories();
    _cachedCategories = categories;
    return categories;
  }

  Future<Category?> getCategory(String id) async {
    return await _db.getCategory(id);
  }

  Future<String> createCategory(Category category) async {
    final id = await _db.createCategory(category);
    _cachedCategories = null; // Invalidate category cache
    return id;
  }

  Future<int> updateCategory(Category category) async {
    final result = await _db.updateCategory(category);
    _cachedCategories = null; // Invalidate category cache
    return result;
  }

  Future<int> deleteCategory(String id) async {
    final result = await _db.deleteCategory(id);
    _cachedCategories = null; // Invalidate category cache
    return result;
  }

  // ==================== Statistics ====================

  Future<int> getCategoriesCount() async {
    return await _db.getCategoriesCount();
  }

  Future<int> getRelationshipsCount() async {
    return await _db.getRelationshipsCount();
  }

  // ==================== Utility ====================

  Future<void> deleteDatabase() async {
    await _db.deleteDatabase();
    clearCache();
  }
}
