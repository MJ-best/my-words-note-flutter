import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../repositories/entry_repository.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final EntryRepository _repository = EntryRepository();
  int _entriesCount = 0;
  int _categoriesCount = 0;
  int _relationshipsCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStatistics();
  }

  Future<void> _loadStatistics() async {
    setState(() => _isLoading = true);
    try {
      final entriesCount = await _repository.getEntriesCount();
      final categoriesCount = await _repository.getCategoriesCount();
      final relationshipsCount = await _repository.getRelationshipsCount();

      setState(() {
        _entriesCount = entriesCount;
        _categoriesCount = categoriesCount;
        _relationshipsCount = relationshipsCount;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _clearDatabase() async {
    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
          'This will permanently delete ALL entries, categories, and relationships. This action cannot be undone.\n\nAre you sure?',
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Delete All'),
            onPressed: () => Navigator.pop(context, true),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final doubleConfirm = await showCupertinoDialog<bool>(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          title: const Text('Final Confirmation'),
          content: const Text(
            'Are you absolutely sure? This is your last chance to cancel.',
          ),
          actions: [
            CupertinoDialogAction(
              child: const Text('Cancel'),
              onPressed: () => Navigator.pop(context, false),
            ),
            CupertinoDialogAction(
              isDestructiveAction: true,
              child: const Text('Yes, Delete Everything'),
              onPressed: () => Navigator.pop(context, true),
            ),
          ],
        ),
      );

      if (doubleConfirm == true) {
        try {
          await _repository.deleteDatabase();
          _loadStatistics();
          if (mounted) {
            showCupertinoDialog(
              context: context,
              builder: (context) => CupertinoAlertDialog(
                content: const Text('All data has been deleted'),
                actions: [
                  CupertinoDialogAction(
                    child: const Text('OK'),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            showCupertinoDialog(
              context: context,
              builder: (context) => CupertinoAlertDialog(
                title: const Text('Error'),
                content: Text('Error clearing database: $e'),
                actions: [
                  CupertinoDialogAction(
                    child: const Text('OK'),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            );
          }
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Settings'),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Info Section
            SliverToBoxAdapter(
              child: _buildSectionHeader('App Information'),
            ),
            SliverToBoxAdapter(
              child: CupertinoListSection.insetGrouped(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  CupertinoListTile(
                    leading: const Icon(CupertinoIcons.info_circle),
                    title: const Text('Version'),
                    trailing: const Text(
                      '1.0.0+1',
                      style: TextStyle(color: CupertinoColors.secondaryLabel),
                    ),
                  ),
                  CupertinoListTile(
                    leading: const Icon(CupertinoIcons.person),
                    title: const Text('Developer'),
                    trailing: const Text(
                      'Min Jun (@MJ-best)',
                      style: TextStyle(color: CupertinoColors.secondaryLabel),
                    ),
                  ),
                  CupertinoListTile(
                    leading: const Icon(CupertinoIcons.link),
                    title: const Text('Open Source'),
                    subtitle: const Text('github.com/MJ-best/my-words-note-flutter'),
                    trailing: const Icon(CupertinoIcons.chevron_right),
                    onTap: () {
                      // Could open URL in browser
                    },
                  ),
                ],
              ),
            ),

            // Statistics Section
            SliverToBoxAdapter(
              child: _buildSectionHeader('Statistics'),
            ),
            SliverToBoxAdapter(
              child: _isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: CupertinoActivityIndicator(radius: 20)),
                    )
                  : CupertinoListSection.insetGrouped(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        CupertinoListTile(
                          leading: const Icon(CupertinoIcons.doc_text),
                          title: const Text('Total Entries'),
                          trailing: Text(
                            '$_entriesCount',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: CupertinoColors.label,
                            ),
                          ),
                        ),
                        CupertinoListTile(
                          leading: const Icon(CupertinoIcons.square_grid_2x2),
                          title: const Text('Categories'),
                          trailing: Text(
                            '$_categoriesCount',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: CupertinoColors.label,
                            ),
                          ),
                        ),
                        CupertinoListTile(
                          leading: const Icon(CupertinoIcons.link),
                          title: const Text('Relationships'),
                          trailing: Text(
                            '$_relationshipsCount',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: CupertinoColors.label,
                            ),
                          ),
                        ),
                      ],
                    ),
            ),

            // Data Management Section
            SliverToBoxAdapter(
              child: _buildSectionHeader('Data Management'),
            ),
            SliverToBoxAdapter(
              child: CupertinoListSection.insetGrouped(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  CupertinoListTile(
                    leading: const Icon(CupertinoIcons.refresh),
                    title: const Text('Refresh Statistics'),
                    trailing: const Icon(CupertinoIcons.chevron_right),
                    onTap: _loadStatistics,
                  ),
                  CupertinoListTile(
                    leading: const Icon(
                      CupertinoIcons.delete,
                      color: CupertinoColors.systemRed,
                    ),
                    title: const Text(
                      'Clear All Data',
                      style: TextStyle(color: CupertinoColors.systemRed),
                    ),
                    subtitle: const Text('Permanently delete all entries and data'),
                    trailing: const Icon(
                      CupertinoIcons.chevron_right,
                      color: CupertinoColors.systemRed,
                    ),
                    onTap: _clearDatabase,
                  ),
                ],
              ),
            ),

            // About Section
            SliverToBoxAdapter(
              child: _buildSectionHeader('About'),
            ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TransKnowledge is a personal knowledge management system for translators and interpreters to build and manage specialized terminology with relationship visualization.',
                      style: TextStyle(
                        fontSize: 15,
                        color: CupertinoColors.label,
                      ),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Features:',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: CupertinoColors.label,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      '• Offline-first design\n'
                      '• Relationship mapping\n'
                      '• Multi-format export\n'
                      '• Category organization\n'
                      '• Search and filtering',
                      style: TextStyle(
                        fontSize: 15,
                        color: CupertinoColors.label,
                      ),
                    ),
                    SizedBox(height: 24),
                    Center(
                      child: Text(
                        'Licensed under MIT License\n© 2025 Min Jun',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: CupertinoColors.secondaryLabel,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 24, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: CupertinoColors.secondaryLabel,
          letterSpacing: -0.08,
        ),
      ),
    );
  }
}
