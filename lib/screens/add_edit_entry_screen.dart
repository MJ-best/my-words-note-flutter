import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/entry.dart';
import '../services/database_service.dart';

class AddEditEntryScreen extends StatefulWidget {
  final Entry? entry;

  const AddEditEntryScreen({super.key, this.entry});

  @override
  State<AddEditEntryScreen> createState() => _AddEditEntryScreenState();
}

class _AddEditEntryScreenState extends State<AddEditEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final DatabaseService _db = DatabaseService.instance;

  late TextEditingController _sourceTextController;
  late TextEditingController _targetTextController;
  late TextEditingController _sourceLanguageController;
  late TextEditingController _targetLanguageController;
  late TextEditingController _categoryController;
  late TextEditingController _tagsController;
  late TextEditingController _pronunciationController;
  late TextEditingController _contextController;
  late TextEditingController _notesController;
  late TextEditingController _sourceReferenceController;

  String _selectedType = 'word';
  int? _difficultyLevel;
  int? _frequency;
  bool _isFavorite = false;

  final List<String> _entryTypes = ['word', 'phrase', 'term', 'expression'];

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;

    _sourceTextController = TextEditingController(text: entry?.sourceText ?? '');
    _targetTextController = TextEditingController(text: entry?.targetText ?? '');
    _sourceLanguageController =
        TextEditingController(text: entry?.sourceLanguage ?? 'English');
    _targetLanguageController =
        TextEditingController(text: entry?.targetLanguage ?? 'Korean');
    _categoryController = TextEditingController(text: entry?.category ?? 'General');
    _tagsController = TextEditingController(text: entry?.tags.join(', ') ?? '');
    _pronunciationController =
        TextEditingController(text: entry?.pronunciation ?? '');
    _contextController = TextEditingController(text: entry?.context ?? '');
    _notesController = TextEditingController(text: entry?.notes ?? '');
    _sourceReferenceController =
        TextEditingController(text: entry?.sourceReference ?? '');

    if (entry != null) {
      _selectedType = entry.type;
      _difficultyLevel = entry.difficultyLevel;
      _frequency = entry.frequency;
      _isFavorite = entry.isFavorite;
    }
  }

  Future<void> _saveEntry() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final now = DateTime.now();
    final entry = Entry(
      id: widget.entry?.id ?? const Uuid().v4(),
      type: _selectedType,
      sourceText: _sourceTextController.text.trim(),
      targetText: _targetTextController.text.trim(),
      sourceLanguage: _sourceLanguageController.text.trim(),
      targetLanguage: _targetLanguageController.text.trim(),
      category: _categoryController.text.trim(),
      tags: _tagsController.text
          .split(',')
          .map((t) => t.trim())
          .where((t) => t.isNotEmpty)
          .toList(),
      pronunciation: _pronunciationController.text.trim().isEmpty
          ? null
          : _pronunciationController.text.trim(),
      context: _contextController.text.trim().isEmpty
          ? null
          : _contextController.text.trim(),
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
      difficultyLevel: _difficultyLevel,
      frequency: _frequency,
      sourceReference: _sourceReferenceController.text.trim().isEmpty
          ? null
          : _sourceReferenceController.text.trim(),
      isFavorite: _isFavorite,
      createdAt: widget.entry?.createdAt ?? now,
      updatedAt: now,
    );

    try {
      if (widget.entry == null) {
        await _db.createEntry(entry);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Entry created successfully')),
          );
        }
      } else {
        await _db.updateEntry(entry);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Entry updated successfully')),
          );
        }
      }
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving entry: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.entry != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Entry' : 'Add Entry'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: _saveEntry,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Entry Type
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: 'Type',
                border: OutlineInputBorder(),
              ),
              items: _entryTypes.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type[0].toUpperCase() + type.substring(1)),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedType = value!;
                });
              },
            ),
            const SizedBox(height: 16),

            // Source Text (Required)
            TextFormField(
              controller: _sourceTextController,
              decoration: const InputDecoration(
                labelText: 'Source Text *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Source text is required';
                }
                return null;
              },
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // Target Text (Required)
            TextFormField(
              controller: _targetTextController,
              decoration: const InputDecoration(
                labelText: 'Target Text *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Target text is required';
                }
                return null;
              },
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // Languages Row
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _sourceLanguageController,
                    decoration: const InputDecoration(
                      labelText: 'Source Language',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.arrow_forward),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _targetLanguageController,
                    decoration: const InputDecoration(
                      labelText: 'Target Language',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Category
            TextFormField(
              controller: _categoryController,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
                helperText: 'e.g., Business, Medical, Technology',
              ),
            ),
            const SizedBox(height: 16),

            // Tags
            TextFormField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags',
                border: OutlineInputBorder(),
                helperText: 'Comma-separated tags',
              ),
            ),
            const SizedBox(height: 16),

            // Pronunciation
            TextFormField(
              controller: _pronunciationController,
              decoration: const InputDecoration(
                labelText: 'Pronunciation',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Context
            TextFormField(
              controller: _contextController,
              decoration: const InputDecoration(
                labelText: 'Context / Usage Example',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes',
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 16),

            // Difficulty Level
            DropdownButtonFormField<int?>(
              value: _difficultyLevel,
              decoration: const InputDecoration(
                labelText: 'Difficulty Level',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Not set')),
                ...List.generate(5, (i) => i + 1).map((level) {
                  return DropdownMenuItem(
                    value: level,
                    child: Text('$level - ${'★' * level}'),
                  );
                }),
              ],
              onChanged: (value) {
                setState(() {
                  _difficultyLevel = value;
                });
              },
            ),
            const SizedBox(height: 16),

            // Frequency
            DropdownButtonFormField<int?>(
              value: _frequency,
              decoration: const InputDecoration(
                labelText: 'Usage Frequency',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Not set')),
                const DropdownMenuItem(value: 1, child: Text('1 - Rare')),
                const DropdownMenuItem(value: 2, child: Text('2 - Uncommon')),
                const DropdownMenuItem(value: 3, child: Text('3 - Common')),
                const DropdownMenuItem(value: 4, child: Text('4 - Frequent')),
                const DropdownMenuItem(value: 5, child: Text('5 - Very Frequent')),
              ],
              onChanged: (value) {
                setState(() {
                  _frequency = value;
                });
              },
            ),
            const SizedBox(height: 16),

            // Source Reference
            TextFormField(
              controller: _sourceReferenceController,
              decoration: const InputDecoration(
                labelText: 'Source Reference',
                border: OutlineInputBorder(),
                helperText: 'Book, article, or other source',
              ),
            ),
            const SizedBox(height: 16),

            // Favorite Toggle
            SwitchListTile(
              value: _isFavorite,
              onChanged: (value) {
                setState(() {
                  _isFavorite = value;
                });
              },
              title: const Text('Mark as Favorite'),
              secondary: Icon(
                _isFavorite ? Icons.favorite : Icons.favorite_border,
                color: _isFavorite ? Colors.red : null,
              ),
            ),
            const SizedBox(height: 32),

            // Save Button
            FilledButton.icon(
              onPressed: _saveEntry,
              icon: const Icon(Icons.save),
              label: Text(isEditing ? 'Update Entry' : 'Create Entry'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.all(16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _sourceTextController.dispose();
    _targetTextController.dispose();
    _sourceLanguageController.dispose();
    _targetLanguageController.dispose();
    _categoryController.dispose();
    _tagsController.dispose();
    _pronunciationController.dispose();
    _contextController.dispose();
    _notesController.dispose();
    _sourceReferenceController.dispose();
    super.dispose();
  }
}
