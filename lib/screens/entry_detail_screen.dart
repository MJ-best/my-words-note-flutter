import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/entry.dart';
import '../models/relationship.dart';
import '../services/database_service.dart';
import 'add_edit_entry_screen.dart';

class EntryDetailScreen extends StatefulWidget {
  final Entry entry;

  const EntryDetailScreen({super.key, required this.entry});

  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  final DatabaseService _db = DatabaseService.instance;
  late Entry _entry;
  List<Relationship> _relationships = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _entry = widget.entry;
    _loadRelationships();
  }

  Future<void> _loadRelationships() async {
    setState(() => _isLoading = true);
    try {
      final relationships = await _db.getRelationshipsForEntry(_entry.id);
      setState(() {
        _relationships = relationships;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleFavorite() async {
    final updated = _entry.copyWith(
      isFavorite: !_entry.isFavorite,
      updatedAt: DateTime.now(),
    );
    await _db.updateEntry(updated);
    setState(() {
      _entry = updated;
    });
  }

  Future<void> _editEntry() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditEntryScreen(entry: _entry),
      ),
    );

    if (result == true) {
      // Reload entry from database
      final updatedEntry = await _db.getEntry(_entry.id);
      if (updatedEntry != null) {
        setState(() {
          _entry = updatedEntry;
        });
      }
    }
  }

  Future<void> _deleteEntry() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete "${_entry.sourceText}"? This cannot be undone.'),
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

    if (confirm == true) {
      await _db.deleteEntry(_entry.id);
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entry deleted')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Entry Details'),
        actions: [
          IconButton(
            icon: Icon(
              _entry.isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _entry.isFavorite ? Colors.red : null,
            ),
            onPressed: _toggleFavorite,
          ),
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _editEntry,
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _deleteEntry,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Type Badge
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _entry.type.toUpperCase(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Source Text
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _entry.sourceLanguage,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _entry.sourceText,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  if (_entry.pronunciation != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      '[${_entry.pronunciation}]',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Arrow
          const Center(
            child: Icon(Icons.arrow_downward, size: 32),
          ),
          const SizedBox(height: 8),

          // Target Text
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _entry.targetLanguage,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _entry.targetText,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Category and Tags
          _buildInfoSection(
            'Category & Tags',
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Chip(
                      label: Text(_entry.category),
                      backgroundColor:
                          Theme.of(context).colorScheme.secondaryContainer,
                    ),
                    ..._entry.tags.map((tag) => Chip(
                          label: Text(tag),
                          backgroundColor:
                              Theme.of(context).colorScheme.tertiaryContainer,
                        )),
                  ],
                ),
              ],
            ),
          ),

          // Context
          if (_entry.context != null)
            _buildInfoSection(
              'Context / Usage',
              Text(_entry.context!),
            ),

          // Notes
          if (_entry.notes != null)
            _buildInfoSection(
              'Notes',
              Text(_entry.notes!),
            ),

          // Difficulty and Frequency
          if (_entry.difficultyLevel != null || _entry.frequency != null)
            _buildInfoSection(
              'Metrics',
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_entry.difficultyLevel != null)
                    Row(
                      children: [
                        const Text('Difficulty: '),
                        Text('${'★' * _entry.difficultyLevel!}'),
                      ],
                    ),
                  if (_entry.frequency != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Frequency: '),
                        Text(_getFrequencyLabel(_entry.frequency!)),
                      ],
                    ),
                  ],
                ],
              ),
            ),

          // Source Reference
          if (_entry.sourceReference != null)
            _buildInfoSection(
              'Source Reference',
              Text(_entry.sourceReference!),
            ),

          // Relationships
          _buildInfoSection(
            'Relationships',
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _relationships.isEmpty
                    ? const Text('No relationships yet')
                    : Column(
                        children: _relationships.map((rel) {
                          return ListTile(
                            leading: const Icon(Icons.link),
                            title: Text(RelationshipType.getDisplayName(
                                rel.relationshipType)),
                            subtitle: Text('Entry ID: ${rel.toEntryId}'),
                          );
                        }).toList(),
                      ),
          ),

          // Metadata
          _buildInfoSection(
            'Metadata',
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Created: ${DateFormat.yMMMd().add_jm().format(_entry.createdAt)}'),
                const SizedBox(height: 4),
                Text('Updated: ${DateFormat.yMMMd().add_jm().format(_entry.updatedAt)}'),
                const SizedBox(height: 4),
                Text('ID: ${_entry.id}',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        content,
        const SizedBox(height: 24),
      ],
    );
  }

  String _getFrequencyLabel(int frequency) {
    switch (frequency) {
      case 1:
        return 'Rare';
      case 2:
        return 'Uncommon';
      case 3:
        return 'Common';
      case 4:
        return 'Frequent';
      case 5:
        return 'Very Frequent';
      default:
        return 'Unknown';
    }
  }
}
