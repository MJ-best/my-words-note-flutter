import 'package:flutter/material.dart';
import '../services/database_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final DatabaseService _db = DatabaseService.instance;
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
      final entriesCount = await _db.getEntriesCount();
      final categoriesCount = await _db.getCategoriesCount();
      final relationshipsCount = await _db.getRelationshipsCount();

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
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
          'This will permanently delete ALL entries, categories, and relationships. This action cannot be undone.\n\nAre you sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete All'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final doubleConfirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Final Confirmation'),
          content: const Text(
            'Are you absolutely sure? This is your last chance to cancel.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Yes, Delete Everything'),
            ),
          ],
        ),
      );

      if (doubleConfirm == true) {
        try {
          await _db.deleteDatabase();
          await _db.database; // Recreate database
          _loadStatistics();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('All data has been deleted')),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error clearing database: $e')),
            );
          }
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // App Info Section
          _buildSectionHeader('App Information'),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('Version'),
            subtitle: const Text('1.0.0+1'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Developer'),
            subtitle: const Text('Min Jun (@MJ-best)'),
          ),
          ListTile(
            leading: const Icon(Icons.code),
            title: const Text('Open Source'),
            subtitle: const Text('github.com/MJ-best/my-words-note-flutter'),
            onTap: () {
              // Could open URL in browser
            },
          ),
          const Divider(),

          // Statistics Section
          _buildSectionHeader('Statistics'),
          _isLoading
              ? const ListTile(
                  title: Center(child: CircularProgressIndicator()),
                )
              : Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.article_outlined),
                      title: const Text('Total Entries'),
                      trailing: Text(
                        '$_entriesCount',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    ListTile(
                      leading: const Icon(Icons.category_outlined),
                      title: const Text('Categories'),
                      trailing: Text(
                        '$_categoriesCount',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    ListTile(
                      leading: const Icon(Icons.link),
                      title: const Text('Relationships'),
                      trailing: Text(
                        '$_relationshipsCount',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                  ],
                ),
          const Divider(),

          // Data Management Section
          _buildSectionHeader('Data Management'),
          ListTile(
            leading: const Icon(Icons.refresh),
            title: const Text('Refresh Statistics'),
            onTap: _loadStatistics,
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever, color: Colors.red),
            title: const Text(
              'Clear All Data',
              style: TextStyle(color: Colors.red),
            ),
            subtitle: const Text('Permanently delete all entries and data'),
            onTap: _clearDatabase,
          ),
          const Divider(),

          // About Section
          _buildSectionHeader('About'),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'TransKnowledge is a personal knowledge management system for translators and interpreters to build and manage specialized terminology with relationship visualization.',
              style: TextStyle(fontSize: 14),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'Features:\n'
              '• Offline-first design\n'
              '• Relationship mapping\n'
              '• Multi-format export\n'
              '• Category organization\n'
              '• Search and filtering',
              style: TextStyle(fontSize: 14),
            ),
          ),
          const SizedBox(height: 24),

          // License
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                'Licensed under MIT License\n© 2025 Min Jun',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
