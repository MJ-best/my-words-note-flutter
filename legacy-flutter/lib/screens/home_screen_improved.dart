import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

    // Haptic feedback for destructive action
    HapticFeedback.mediumImpact();

    final success = await provider.deleteEntry(entry);
    if (success && mounted) {
      // Show brief confirmation (iOS style - no undo in swipe delete)
      HapticFeedback.notificationOccurred(NotificationFeedbackType.success);
    }
  }

  Future<void> _toggleFavorite(Entry entry) async {
    // Light haptic for toggle
    HapticFeedback.selectionClick();
    await context.read<EntryProvider>().toggleFavorite(entry);
  }

  void _showMoreMenu() {
    HapticFeedback.selectionClick();

    final provider = context.read<EntryProvider>();

    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _showCategoryFilter();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.line_horizontal_3_decrease),
                const SizedBox(width: 8),
                const Text('Filter by Category'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              provider.toggleFavorites();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  provider.showFavoritesOnly
                      ? CupertinoIcons.heart_fill
                      : CupertinoIcons.heart,
                  color: provider.showFavoritesOnly
                      ? CupertinoColors.systemRed
                      : null,
                ),
                const SizedBox(width: 8),
                Text(provider.showFavoritesOnly
                    ? 'Show All Entries'
                    : 'Show Favorites Only'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _showExportMenu();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.share),
                const SizedBox(width: 8),
                const Text('Export Data'),
              ],
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _showCategoryFilter() {
    final provider = context.read<EntryProvider>();

    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Filter by Category'),
        actions: [
          CupertinoActionSheetAction(
            isDefaultAction: provider.selectedCategory == 'All',
            onPressed: () {
              provider.setCategory('All');
              Navigator.pop(context);
            },
            child: const Text('All Categories'),
          ),
          ..._categories.map((category) {
            return CupertinoActionSheetAction(
              isDefaultAction: provider.selectedCategory == category.name,
              onPressed: () {
                provider.setCategory(category.name);
                Navigator.pop(context);
              },
              child: Text(category.name),
            );
          }),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _showExportMenu() {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Export Data'),
        message: const Text('Choose export format'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () => _performExport('json'),
            child: const Text('Export as JSON'),
          ),
          CupertinoActionSheetAction(
            onPressed: () => _performExport('csv'),
            child: const Text('Export as CSV'),
          ),
          CupertinoActionSheetAction(
            onPressed: () => _performExport('txt'),
            child: const Text('Export as Text'),
          ),
          CupertinoActionSheetAction(
            onPressed: () => _performExport('md'),
            child: const Text('Export as Markdown'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  Future<void> _performExport(String format) async {
    Navigator.pop(context);

    setState(() => _isExporting = true);

    if (mounted) {
      showCupertinoDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CupertinoActivityIndicator(radius: 20),
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
        Navigator.pop(context);
        HapticFeedback.notificationOccurred(NotificationFeedbackType.success);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        HapticFeedback.notificationOccurred(NotificationFeedbackType.error);
        showCupertinoDialog(
          context: context,
          builder: (context) => CupertinoAlertDialog(
            title: const Text('Export Failed'),
            content: Text('$e'),
            actions: [
              CupertinoDialogAction(
                child: const Text('OK'),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      }
    } finally {
      setState(() => _isExporting = false);
    }
  }

  void _addNewEntry() {
    HapticFeedback.selectionClick();
    Navigator.push(
      context,
      CupertinoPageRoute(
        builder: (context) => const AddEditEntryScreen(),
      ),
    ).then((_) => context.read<EntryProvider>().refreshEntries());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<EntryProvider>(
      builder: (context, provider, child) {
        return CupertinoPageScaffold(
          // Large title navigation bar (like Notes, Reminders)
          navigationBar: CupertinoNavigationBar(
            // Apple HIG: Maximum 2 actions in trailing
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Primary action: Add new entry
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  minSize: 44,
                  onPressed: _addNewEntry,
                  child: const Icon(CupertinoIcons.add_circled),
                ),
                // Secondary action: More options menu
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  minSize: 44,
                  onPressed: _showMoreMenu,
                  child: const Icon(CupertinoIcons.ellipsis_circle),
                ),
              ],
            ),
            // Remove middle for large title effect
            border: null,
          ),
          child: SafeArea(
            bottom: false,
            child: CustomScrollView(
              controller: _scrollController,
              slivers: [
                // Large title (iOS 11+ style)
                CupertinoSliverNavigationBar(
                  largeTitle: const Text('TransKnowledge'),
                  border: null,
                ),

                // Search bar
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: CupertinoSearchTextField(
                      controller: _searchController,
                      placeholder: 'Search',
                      onChanged: provider.searchEntries,
                      onSuffixTap: () {
                        _searchController.clear();
                        provider.searchEntries('');
                      },
                    ),
                  ),
                ),

                // Active filters chip
                if (provider.selectedCategory != 'All' ||
                    provider.showFavoritesOnly)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Wrap(
                        spacing: 8,
                        children: [
                          if (provider.selectedCategory != 'All')
                            _buildFilterChip(
                              provider.selectedCategory,
                              CupertinoIcons.xmark_circle_fill,
                              () => provider.setCategory('All'),
                            ),
                          if (provider.showFavoritesOnly)
                            _buildFilterChip(
                              'Favorites',
                              CupertinoIcons.xmark_circle_fill,
                              provider.toggleFavorites,
                            ),
                        ],
                      ),
                    ),
                  ),

                // Pull to refresh
                CupertinoSliverRefreshControl(
                  onRefresh: provider.refreshEntries,
                ),

                // Content
                provider.isLoading && provider.entries.isEmpty
                    ? const SliverFillRemaining(
                        child: Center(
                          child: CupertinoActivityIndicator(radius: 20),
                        ),
                      )
                    : provider.entries.isEmpty
                        ? SliverFillRemaining(
                            child: _buildEmptyState(provider),
                          )
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                if (index == provider.entries.length) {
                                  return Padding(
                                    padding: const EdgeInsets.all(32.0),
                                    child: Center(
                                      child: provider.isLoadingMore
                                          ? const CupertinoActivityIndicator()
                                          : Text(
                                              provider.hasMore
                                                  ? ''
                                                  : 'No more entries',
                                              style: const TextStyle(
                                                color: CupertinoColors
                                                    .secondaryLabel,
                                                fontSize: 13,
                                              ),
                                            ),
                                    ),
                                  );
                                }

                                final entry = provider.entries[index];
                                return _buildEntryListItem(entry);
                              },
                              childCount: provider.entries.length +
                                  (provider.hasMore ? 1 : 0),
                            ),
                          ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: CupertinoColors.systemBlue,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: CupertinoColors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              icon,
              size: 16,
              color: CupertinoColors.white,
            ),
          ],
        ),
      ),
    );
  }

  // Professional iOS-style list item with swipe actions
  Widget _buildEntryListItem(Entry entry) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: CupertinoContextMenu(
          actions: [
            CupertinoContextMenuAction(
              trailingIcon: entry.isFavorite
                  ? CupertinoIcons.heart_fill
                  : CupertinoIcons.heart,
              onPressed: () {
                Navigator.pop(context);
                _toggleFavorite(entry);
              },
              child: Text(entry.isFavorite ? 'Unfavorite' : 'Favorite'),
            ),
            CupertinoContextMenuAction(
              trailingIcon: CupertinoIcons.pencil,
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  CupertinoPageRoute(
                    builder: (context) => AddEditEntryScreen(entry: entry),
                  ),
                ).then((_) =>
                    context.read<EntryProvider>().refreshEntries());
              },
              child: const Text('Edit'),
            ),
            CupertinoContextMenuAction(
              isDestructiveAction: true,
              trailingIcon: CupertinoIcons.delete,
              onPressed: () {
                Navigator.pop(context);
                _showDeleteConfirmation(entry);
              },
              child: const Text('Delete'),
            ),
          ],
          child: Container(
            decoration: BoxDecoration(
              color: CupertinoColors.systemBackground,
              border: Border.all(
                color: CupertinoColors.separator,
                width: 0.5,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: CupertinoListTile(
              onTap: () {
                HapticFeedback.selectionClick();
                Navigator.push(
                  context,
                  CupertinoPageRoute(
                    builder: (context) => EntryDetailScreen(entry: entry),
                  ),
                ).then((_) =>
                    context.read<EntryProvider>().refreshEntries());
              },
              leading: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: CupertinoColors.systemBlue,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    entry.sourceText.isNotEmpty
                        ? entry.sourceText[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      color: CupertinoColors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              title: Row(
                children: [
                  Expanded(
                    child: Text(
                      entry.sourceText,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                        color: CupertinoColors.label,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (entry.isFavorite)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(
                        CupertinoIcons.heart_fill,
                        size: 14,
                        color: CupertinoColors.systemRed,
                      ),
                    ),
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 2),
                  Text(
                    entry.targetText,
                    style: const TextStyle(
                      fontSize: 15,
                      color: CupertinoColors.secondaryLabel,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: CupertinoColors.systemGrey5,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          entry.category,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: CupertinoColors.secondaryLabel,
                          ),
                        ),
                      ),
                      if (entry.tags.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            entry.tags.join(' · '),
                            style: const TextStyle(
                              fontSize: 11,
                              color: CupertinoColors.tertiaryLabel,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              trailing: const Icon(
                CupertinoIcons.chevron_right,
                size: 18,
                color: CupertinoColors.systemGrey3,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmation(Entry entry) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete "${entry.sourceText}"?'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () {
              Navigator.pop(context);
              _deleteEntry(entry);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(EntryProvider provider) {
    String message;
    String subtitle;
    IconData icon;

    if (provider.searchQuery.isNotEmpty) {
      icon = CupertinoIcons.search;
      message = 'No Results';
      subtitle = 'Try a different search term';
    } else if (provider.showFavoritesOnly) {
      icon = CupertinoIcons.heart;
      message = 'No Favorites';
      subtitle = 'Long press an entry and tap the heart to add favorites';
    } else if (provider.selectedCategory != 'All') {
      icon = CupertinoIcons.square_grid_2x2;
      message = 'No Entries';
      subtitle = 'No entries in "${provider.selectedCategory}"';
    } else {
      icon = CupertinoIcons.doc_text;
      message = 'No Entries';
      subtitle = 'Tap  to create your first entry';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: CupertinoColors.systemGrey3,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: CupertinoColors.label,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 15,
                color: CupertinoColors.secondaryLabel,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
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
