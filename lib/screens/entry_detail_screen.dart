import 'package:flutter/cupertino.dart';
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
      CupertinoPageRoute(
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
    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete "${_entry.sourceText}"? This cannot be undone.'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Delete'),
            onPressed: () => Navigator.pop(context, true),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _db.deleteEntry(_entry.id);
      if (mounted) {
        Navigator.pop(context, true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text('Entry Details'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 44,
              onPressed: _toggleFavorite,
              child: Icon(
                _entry.isFavorite
                    ? CupertinoIcons.heart_fill
                    : CupertinoIcons.heart,
                color: _entry.isFavorite ? CupertinoColors.systemRed : null,
              ),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 44,
              onPressed: _editEntry,
              child: const Icon(CupertinoIcons.pencil),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 44,
              onPressed: _deleteEntry,
              child: const Icon(CupertinoIcons.delete),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Type Badge
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: CupertinoColors.systemBlue,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  _entry.type.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: CupertinoColors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Source Text
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _entry.sourceLanguage,
                    style: const TextStyle(
                      fontSize: 13,
                      color: CupertinoColors.secondaryLabel,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _entry.sourceText,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: CupertinoColors.label,
                    ),
                  ),
                  if (_entry.pronunciation != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      '[${_entry.pronunciation}]',
                      style: const TextStyle(
                        fontSize: 17,
                        fontStyle: FontStyle.italic,
                        color: CupertinoColors.secondaryLabel,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Arrow
            const Center(
              child: Icon(CupertinoIcons.arrow_down, size: 32),
            ),
            const SizedBox(height: 8),

            // Target Text
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _entry.targetLanguage,
                    style: const TextStyle(
                      fontSize: 13,
                      color: CupertinoColors.secondaryLabel,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _entry.targetText,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: CupertinoColors.label,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Category and Tags
            _buildInfoSection(
              'Category & Tags',
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: CupertinoColors.systemGrey5,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_entry.category),
                  ),
                  ..._entry.tags.map((tag) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: CupertinoColors.systemGrey5,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(tag),
                      )),
                ],
              ),
            ),

            // Context
            if (_entry.context != null)
              _buildInfoSection(
                'Context / Usage',
                Text(
                  _entry.context!,
                  style: const TextStyle(color: CupertinoColors.label),
                ),
              ),

            // Notes
            if (_entry.notes != null)
              _buildInfoSection(
                'Notes',
                Text(
                  _entry.notes!,
                  style: const TextStyle(color: CupertinoColors.label),
                ),
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
                          const Text(
                            'Difficulty: ',
                            style: TextStyle(color: CupertinoColors.label),
                          ),
                          Text(
                            '${'★' * _entry.difficultyLevel!}',
                            style: const TextStyle(color: CupertinoColors.systemYellow),
                          ),
                        ],
                      ),
                    if (_entry.frequency != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Text(
                            'Frequency: ',
                            style: TextStyle(color: CupertinoColors.label),
                          ),
                          Text(
                            _getFrequencyLabel(_entry.frequency!),
                            style: const TextStyle(color: CupertinoColors.label),
                          ),
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
                Text(
                  _entry.sourceReference!,
                  style: const TextStyle(color: CupertinoColors.label),
                ),
              ),

            // Relationships
            _buildInfoSection(
              'Relationships',
              _isLoading
                  ? const Center(child: CupertinoActivityIndicator())
                  : _relationships.isEmpty
                      ? const Text(
                          'No relationships yet',
                          style: TextStyle(color: CupertinoColors.secondaryLabel),
                        )
                      : Column(
                          children: _relationships.map((rel) {
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: CupertinoColors.systemGrey6,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(CupertinoIcons.link, size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          RelationshipType.getDisplayName(
                                              rel.relationshipType),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: CupertinoColors.label,
                                          ),
                                        ),
                                        Text(
                                          'Entry ID: ${rel.toEntryId}',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: CupertinoColors.secondaryLabel,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
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
                  Text(
                    'Created: ${DateFormat.yMMMd().add_jm().format(_entry.createdAt)}',
                    style: const TextStyle(color: CupertinoColors.label),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Updated: ${DateFormat.yMMMd().add_jm().format(_entry.updatedAt)}',
                    style: const TextStyle(color: CupertinoColors.label),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ID: ${_entry.id}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: CupertinoColors.tertiaryLabel,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: CupertinoColors.label,
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
