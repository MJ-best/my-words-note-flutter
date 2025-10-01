import 'package:flutter/material.dart';
import '../models/entry.dart';
import '../services/database_service.dart';
import '../services/export_service.dart';
import 'entry_detail_screen.dart';
import 'add_edit_entry_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseService _db = DatabaseService.instance;
  final ExportService _exportService = ExportService();
  final TextEditingController _searchController = TextEditingController();

  List<Entry> _entries = [];
  List<Entry> _filteredEntries = [];
  bool _isLoading = true;
  bool _showFavoritesOnly = false;
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  Future<void> _loadEntries() async {
    setState(() => _isLoading = true);
    try {
      final entries = await _db.getAllEntries();
      setState(() {
        _entries = entries;
        _filteredEntries = entries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading entries: $e')),
        );
      }
    }
  }

  void _filterEntries(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredEntries = _entries;
      } else {
        _filteredEntries = _entries.where((entry) {
          return entry.sourceText.toLowerCase().contains(query.toLowerCase()) ||
              entry.targetText.toLowerCase().contains(query.toLowerCase()) ||
              (entry.notes?.toLowerCase().contains(query.toLowerCase()) ?? false);
        }).toList();
      }

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
    });
  }

  void _toggleFavorites() {
    setState(() {
      _showFavoritesOnly = !_showFavoritesOnly;
      _filterEntries(_searchController.text);
    });
  }

  Future<void> _deleteEntry(Entry entry) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete "${entry.sourceText}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _db.deleteEntry(entry.id);
      _loadEntries();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entry deleted')),
        );
      }
    }
  }

  Future<void> _toggleFavorite(Entry entry) async {
    final updated = entry.copyWith(
      isFavorite: !entry.isFavorite,
      updatedAt: DateTime.now(),
    );
    await _db.updateEntry(updated);
    _loadEntries();
  }

  void _showExportMenu() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.data_object),
              title: const Text('Export as JSON'),
              onTap: () async {
                Navigator.pop(context);
                try {
                  await _exportService.exportAndShareJson();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Exported successfully')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Export failed: $e')),
                    );
                  }
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.table_chart),
              title: const Text('Export as CSV'),
              onTap: () async {
                Navigator.pop(context);
                try {
                  await _exportService.exportAndShareCsv();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Exported successfully')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Export failed: $e')),
                    );
                  }
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.text_snippet),
              title: const Text('Export as Text'),
              onTap: () async {
                Navigator.pop(context);
                try {
                  await _exportService.exportAndSharePlainText();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Exported successfully')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Export failed: $e')),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TransKnowledge'),
        actions: [
          IconButton(
            icon: Icon(
              _showFavoritesOnly ? Icons.favorite : Icons.favorite_border,
              color: _showFavoritesOnly ? Colors.red : null,
            ),
            onPressed: _toggleFavorites,
            tooltip: 'Show favorites only',
          ),
          IconButton(
            icon: const Icon(Icons.file_upload),
            onPressed: _showExportMenu,
            tooltip: 'Export data',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search entries...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _filterEntries('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: _filterEntries,
            ),
          ),

          // Entry list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredEntries.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inbox,
                              size: 64,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _entries.isEmpty
                                  ? 'No entries yet'
                                  : 'No matching entries',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _entries.isEmpty
                                  ? 'Tap + to add your first entry'
                                  : 'Try a different search',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _filteredEntries.length,
                        itemBuilder: (context, index) {
                          final entry = _filteredEntries[index];
                          return EntryListTile(
                            entry: entry,
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      EntryDetailScreen(entry: entry),
                                ),
                              );
                              _loadEntries();
                            },
                            onFavoriteToggle: () => _toggleFavorite(entry),
                            onDelete: () => _deleteEntry(entry),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AddEditEntryScreen(),
            ),
          );
          _loadEntries();
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class EntryListTile extends StatelessWidget {
  final Entry entry;
  final VoidCallback onTap;
  final VoidCallback onFavoriteToggle;
  final VoidCallback onDelete;

  const EntryListTile({
    super.key,
    required this.entry,
    required this.onTap,
    required this.onFavoriteToggle,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          child: Text(
            entry.sourceText.isNotEmpty ? entry.sourceText[0].toUpperCase() : '?',
          ),
        ),
        title: Text(
          entry.sourceText,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(entry.targetText),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    entry.category,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSecondaryContainer,
                    ),
                  ),
                ),
                if (entry.tags.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      entry.tags.join(', '),
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.6),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(
                entry.isFavorite ? Icons.favorite : Icons.favorite_border,
                color: entry.isFavorite ? Colors.red : null,
              ),
              onPressed: onFavoriteToggle,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}
