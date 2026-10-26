import 'package:flutter/cupertino.dart';
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
    if (_sourceTextController.text.trim().isEmpty ||
        _targetTextController.text.trim().isEmpty) {
      showCupertinoDialog(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          title: const Text('Validation Error'),
          content: const Text('Source text and target text are required'),
          actions: [
            CupertinoDialogAction(
              child: const Text('OK'),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      );
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
      } else {
        await _db.updateEntry(entry);
      }
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (context) => CupertinoAlertDialog(
            title: const Text('Error'),
            content: Text('Error saving entry: $e'),
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

  void _showTypePicker() {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: 200,
        color: CupertinoColors.systemBackground,
        child: Column(
          children: [
            Container(
              height: 44,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Text('Done'),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            Expanded(
              child: CupertinoPicker(
                itemExtent: 32,
                onSelectedItemChanged: (index) {
                  setState(() {
                    _selectedType = _entryTypes[index];
                  });
                },
                children: _entryTypes
                    .map((type) => Text(type[0].toUpperCase() + type.substring(1)))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.entry != null;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(isEditing ? 'Edit Entry' : 'Add Entry'),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Text('Save'),
          onPressed: _saveEntry,
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Entry Type
            GestureDetector(
              onTap: _showTypePicker,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CupertinoColors.systemGrey6,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Type', style: TextStyle(color: CupertinoColors.label)),
                    Text(
                      _selectedType[0].toUpperCase() + _selectedType.substring(1),
                      style: const TextStyle(color: CupertinoColors.systemBlue),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Source Text
            CupertinoTextField(
              controller: _sourceTextController,
              placeholder: 'Source Text *',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // Target Text
            CupertinoTextField(
              controller: _targetTextController,
              placeholder: 'Target Text *',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // Languages Row
            Row(
              children: [
                Expanded(
                  child: CupertinoTextField(
                    controller: _sourceLanguageController,
                    placeholder: 'Source Language',
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: CupertinoColors.systemGrey6,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(CupertinoIcons.arrow_right, size: 20),
                ),
                Expanded(
                  child: CupertinoTextField(
                    controller: _targetLanguageController,
                    placeholder: 'Target Language',
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: CupertinoColors.systemGrey6,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Category
            CupertinoTextField(
              controller: _categoryController,
              placeholder: 'Category',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 16),

            // Tags
            CupertinoTextField(
              controller: _tagsController,
              placeholder: 'Tags (comma-separated)',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 16),

            // Pronunciation
            CupertinoTextField(
              controller: _pronunciationController,
              placeholder: 'Pronunciation',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 16),

            // Context
            CupertinoTextField(
              controller: _contextController,
              placeholder: 'Context / Usage Example',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Notes
            CupertinoTextField(
              controller: _notesController,
              placeholder: 'Notes',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 16),

            // Difficulty and Frequency
            const Text(
              'Difficulty Level',
              style: TextStyle(
                fontSize: 15,
                color: CupertinoColors.secondaryLabel,
              ),
            ),
            const SizedBox(height: 8),
            CupertinoSegmentedControl<int?>(
              children: const {
                null: Text('None'),
                1: Text('★'),
                2: Text('★★'),
                3: Text('★★★'),
                4: Text('★★★★'),
                5: Text('★★★★★'),
              },
              groupValue: _difficultyLevel,
              onValueChanged: (value) {
                setState(() {
                  _difficultyLevel = value;
                });
              },
            ),
            const SizedBox(height: 24),

            // Source Reference
            CupertinoTextField(
              controller: _sourceReferenceController,
              placeholder: 'Source Reference',
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 16),

            // Favorite Toggle
            Container(
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.circular(8),
              ),
              child: CupertinoListTile(
                title: const Text('Mark as Favorite'),
                leading: Icon(
                  _isFavorite ? CupertinoIcons.heart_fill : CupertinoIcons.heart,
                  color: _isFavorite ? CupertinoColors.systemRed : null,
                ),
                trailing: CupertinoSwitch(
                  value: _isFavorite,
                  onChanged: (value) {
                    setState(() {
                      _isFavorite = value;
                    });
                  },
                  activeColor: CupertinoColors.systemGreen,
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Save Button
            SizedBox(
              height: 44,
              child: CupertinoButton.filled(
                padding: EdgeInsets.zero,
                onPressed: _saveEntry,
                child: Text(isEditing ? 'Update Entry' : 'Create Entry'),
              ),
            ),
            const SizedBox(height: 32),
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
