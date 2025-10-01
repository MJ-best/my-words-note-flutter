import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/entry.dart';
import '../models/category.dart';
import '../providers/entry_provider.dart';
import '../repositories/entry_repository.dart';
import '../services/export_service.dart';
import 'entry_detail_screen.dart';
import 'add_edit_entry_screen.dart';

class HomeScreenImproved extends StatefulWidget {
  const HomeScreenImproved({super.key});

  @override
  State<HomeScreenImproved> createState() => _HomeScreenImprovedState();
}

class _HomeScreenImprovedState extends State<HomeScreenImproved> {
  final ExportService _exportService = ExportService();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final EntryRepository _repository = EntryRepository();

  List<Category> _categories = [];
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadCategories();

    // Initial load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EntryProvider>().loadEntries(refresh: true);
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      // Load more when scrolled 80% down
      context.read<EntryProvider>().loadMoreEntries();
    }
  }

  Future<void> _loadCategories() async {
    final categories = await _repository.getAllCategories();
    setState(() {
      _categories = categories;
    });
  }

  Future<void> _deleteEntry(Entry entry) async {
    final provider = context.read<EntryProvider>();

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
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final success = await provider.deleteEntry(entry);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Entry deleted'),
            action: SnackBarAction(
              label: 'UNDO',
              onPressed: () async {
                final undone = await provider.undoDelete();
                if (undone && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Entry restored')),
                  );
                }
              },
            ),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  void _showCategoryFilter() {
    final provider = context.read<EntryProvider>();

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Filter by Category',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.all_inclusive),
              title: const Text('All Categories'),
              trailing: provider.selectedCategory == 'All'
                  ? const Icon(Icons.check, color: Colors.blue)
                  : null,
              onTap: () {
                provider.setCategory('All');
                Navigator.pop(context);
              },
            ),
            ..._categories.map((category) {
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: category.getColor(),
                  child: Icon(category.getIcon(), color: Colors.white, size: 20),
                ),
                title: Text(category.name),
                trailing: provider.selectedCategory == category.name
                    ? const Icon(Icons.check, color: Colors.blue)
                    : null,
                onTap: () {
                  provider.setCategory(category.name);
                  Navigator.pop(context);
                },
              );
            }),
          ],
        ),
      ),
    );
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
              onTap: () => _performExport('json'),
            ),
            ListTile(
              leading: const Icon(Icons.table_chart),
              title: const Text('Export as CSV'),
              onTap: () => _performExport('csv'),
            ),
            ListTile(
              leading: const Icon(Icons.text_snippet),
              title: const Text('Export as Text'),
              onTap: () => _performExport('txt'),
            ),
            ListTile(
              leading: const Icon(Icons.description),
              title: const Text('Export as Markdown'),
              onTap: () => _performExport('md'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _performExport(String format) async {
    Navigator.pop(context); // Close bottom sheet

    setState(() => _isExporting = true);

    // Show progress dialog
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Exporting data...'),
            ],
          ),
        ),
      );
    }

    try {
      switch (format) {
        case 'json':
          await _exportService.exportAndShareJson();
          break;
        case 'csv':
          await _exportService.exportAndShareCsv();
          break;
        case 'txt':
          await _exportService.exportAndSharePlainText();
          break;
        case 'md':
          await _exportService.exportAndShareMarkdown();
          break;
      }

      if (mounted) {
        Navigator.pop(context); // Close progress dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Export successful!')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close progress dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    } finally {
      setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<EntryProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('TransKnowledge'),
            actions: [
              // Category filter badge
              if (provider.selectedCategory != 'All')
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(provider.selectedCategory),
                    onSelected: (_) => _showCategoryFilter(),
                    selected: true,
                  ),
                ),
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: _showCategoryFilter,
                tooltip: 'Filter by category',
              ),
              IconButton(
                icon: Icon(
                  provider.showFavoritesOnly
                      ? Icons.favorite
                      : Icons.favorite_border,
                  color: provider.showFavoritesOnly ? Colors.red : null,
                ),
                onPressed: provider.toggleFavorites,
                tooltip: 'Show favorites only',
              ),
              IconButton(
                icon: const Icon(Icons.file_upload),
                onPressed: _isExporting ? null : _showExportMenu,
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
                              provider.searchEntries('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onChanged: provider.searchEntries,
                ),
              ),

              // Entry list with pull-to-refresh
              Expanded(
                child: RefreshIndicator(
                  onRefresh: provider.refreshEntries,
                  child: provider.isLoading && provider.entries.isEmpty
                      ? const Center(child: CircularProgressIndicator())
                      : provider.entries.isEmpty
                          ? _buildEmptyState(provider)
                          : ListView.builder(
                              controller: _scrollController,
                              itemCount: provider.entries.length +
                                  (provider.hasMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                // Loading indicator at bottom
                                if (index == provider.entries.length) {
                                  return Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Center(
                                      child: provider.isLoadingMore
                                          ? const CircularProgressIndicator()
                                          : const Text('No more entries'),
                                    ),
                                  );
                                }

                                final entry = provider.entries[index];
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
                                    provider.refreshEntries();
                                  },
                                  onFavoriteToggle: () =>
                                      provider.toggleFavorite(entry),
                                  onDelete: () => _deleteEntry(entry),
                                );
                              },
                            ),
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
              provider.refreshEntries();
            },
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(EntryProvider provider) {
    String message;
    String subtitle;

    if (provider.searchQuery.isNotEmpty) {
      message = 'No matching entries';
      subtitle = 'Try a different search';
    } else if (provider.showFavoritesOnly) {
      message = 'No favorites yet';
      subtitle = 'Tap the heart icon on entries to add favorites';
    } else if (provider.selectedCategory != 'All') {
      message = 'No entries in this category';
      subtitle = 'Add entries or change filter';
    } else {
      message = 'No entries yet';
      subtitle = 'Tap + to add your first entry';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 80,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
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
            entry.sourceText.isNotEmpty
                ? entry.sourceText[0].toUpperCase()
                : '?',
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    entry.category,
                    style: TextStyle(
                      fontSize: 12,
                      color:
                          Theme.of(context).colorScheme.onSecondaryContainer,
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
