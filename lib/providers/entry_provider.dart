import 'package:flutter/foundation.dart';
import '../models/entry.dart';
import '../repositories/entry_repository.dart';
import 'dart:async';

/// State management for entries with debounced search and pagination
class EntryProvider with ChangeNotifier {
  final EntryRepository _repository;

  EntryProvider({EntryRepository? repository})
      : _repository = repository ?? EntryRepository();

  // State
  List<Entry> _entries = [];
  List<Entry> _filteredEntries = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _showFavoritesOnly = false;
  String _selectedCategory = 'All';
  String _searchQuery = '';

  // Pagination
  int _currentPage = 0;
  static const int _pageSize = 20;
  bool _hasMore = true;
  bool _isLoadingMore = false;

  // Debounce timer for search
  Timer? _debounceTimer;
  static const _debounceDuration = Duration(milliseconds: 300);

  // Deleted entry for undo
  Entry? _lastDeletedEntry;
  int? _lastDeletedIndex;

  // Getters
  List<Entry> get entries => _filteredEntries;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get showFavoritesOnly => _showFavoritesOnly;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  bool get hasMore => _hasMore;
  bool get isLoadingMore => _isLoadingMore;
  bool get canUndo => _lastDeletedEntry != null;

  // Load entries with pagination
  Future<void> loadEntries({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 0;
      _entries.clear();
      _hasMore = true;
      await _repository.clearCache();
    }

    if (_isLoading || _isLoadingMore) return;

    if (refresh) {
      _isLoading = true;
      _errorMessage = null;
    } else {
      _isLoadingMore = true;
    }
    notifyListeners();

    try {
      final newEntries = await _repository.getEntriesPaginated(
        offset: _currentPage * _pageSize,
        limit: _pageSize,
      );

      if (newEntries.length < _pageSize) {
        _hasMore = false;
      }

      if (refresh) {
        _entries = newEntries;
      } else {
        _entries.addAll(newEntries);
      }

      _currentPage++;
      _applyFilters();
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'Failed to load entries: $e';
      debugPrint(_errorMessage);
    } finally {
      _isLoading = false;
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  // Refresh entries (pull-to-refresh)
  Future<void> refreshEntries() async {
    await loadEntries(refresh: true);
  }

  // Load more entries (pagination)
  Future<void> loadMoreEntries() async {
    if (!_hasMore || _isLoadingMore) return;
    await loadEntries(refresh: false);
  }

  // Search with debouncing
  void searchEntries(String query) {
    _searchQuery = query;

    // Cancel previous timer
    _debounceTimer?.cancel();

    // Create new timer
    _debounceTimer = Timer(_debounceDuration, () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      _applyFilters();
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final searchResults = await _repository.searchEntries(query);
      _filteredEntries = searchResults;
      _applyAdditionalFilters();
    } catch (e) {
      _errorMessage = 'Search failed: $e';
      debugPrint(_errorMessage);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Toggle favorites filter
  void toggleFavorites() {
    _showFavoritesOnly = !_showFavoritesOnly;
    _applyFilters();
    notifyListeners();
  }

  // Set category filter
  void setCategory(String category) {
    _selectedCategory = category;
    _applyFilters();
    notifyListeners();
  }

  // Apply all filters
  void _applyFilters() {
    _filteredEntries = List.from(_entries);
    _applyAdditionalFilters();
  }

  void _applyAdditionalFilters() {
    // Apply category filter
    if (_selectedCategory != 'All') {
      _filteredEntries = _filteredEntries
          .where((entry) => entry.category == _selectedCategory)
          .toList();
    }

    // Apply favorites filter
    if (_showFavoritesOnly) {
      _filteredEntries =
          _filteredEntries.where((entry) => entry.isFavorite).toList();
    }
  }

  // Create entry
  Future<bool> createEntry(Entry entry) async {
    try {
      await _repository.createEntry(entry);
      await refreshEntries();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to create entry: $e';
      notifyListeners();
      return false;
    }
  }

  // Update entry
  Future<bool> updateEntry(Entry entry) async {
    try {
      await _repository.updateEntry(entry);
      await refreshEntries();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to update entry: $e';
      notifyListeners();
      return false;
    }
  }

  // Toggle favorite
  Future<void> toggleFavorite(Entry entry) async {
    final updated = entry.copyWith(
      isFavorite: !entry.isFavorite,
      updatedAt: DateTime.now(),
    );
    await updateEntry(updated);
  }

  // Delete entry with undo support
  Future<bool> deleteEntry(Entry entry) async {
    try {
      // Store for undo
      _lastDeletedEntry = entry;
      _lastDeletedIndex = _entries.indexOf(entry);

      await _repository.deleteEntry(entry.id);
      await refreshEntries();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to delete entry: $e';
      notifyListeners();
      return false;
    }
  }

  // Undo delete
  Future<bool> undoDelete() async {
    if (_lastDeletedEntry == null) return false;

    try {
      await _repository.createEntry(_lastDeletedEntry!);
      _lastDeletedEntry = null;
      _lastDeletedIndex = null;
      await refreshEntries();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to undo delete: $e';
      notifyListeners();
      return false;
    }
  }

  // Clear undo buffer
  void clearUndo() {
    _lastDeletedEntry = null;
    _lastDeletedIndex = null;
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}
