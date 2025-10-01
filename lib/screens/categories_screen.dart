import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/category.dart';
import '../models/entry.dart';
import '../services/database_service.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final DatabaseService _db = DatabaseService.instance;
  List<Category> _categories = [];
  Map<String, int> _entryCounts = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() => _isLoading = true);
    try {
      final categories = await _db.getAllCategories();
      final Map<String, int> counts = {};

      // Count entries per category
      for (final category in categories) {
        final entries = await _db.getEntriesByCategory(category.name);
        counts[category.name] = entries.length;
      }

      setState(() {
        _categories = categories;
        _entryCounts = counts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading categories: $e')),
        );
      }
    }
  }

  Future<void> _addCategory() async {
    await showDialog(
      context: context,
      builder: (context) => AddEditCategoryDialog(
        onSave: (category) async {
          await _db.createCategory(category);
          _loadCategories();
        },
      ),
    );
  }

  Future<void> _editCategory(Category category) async {
    await showDialog(
      context: context,
      builder: (context) => AddEditCategoryDialog(
        category: category,
        onSave: (updatedCategory) async {
          await _db.updateCategory(updatedCategory);
          _loadCategories();
        },
      ),
    );
  }

  Future<void> _deleteCategory(Category category) async {
    final entryCount = _entryCounts[category.name] ?? 0;

    if (entryCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Cannot delete category with $entryCount entries. Reassign or delete entries first.'),
        ),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Category'),
        content: Text('Delete "${category.name}"?'),
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
      await _db.deleteCategory(category.id);
      _loadCategories();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Category deleted')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _categories.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.category_outlined,
                        size: 64,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No categories yet',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tap + to create your first category',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final entryCount = _entryCounts[category.name] ?? 0;

                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: category.getColor(),
                          child: Icon(
                            category.getIcon(),
                            color: Colors.white,
                          ),
                        ),
                        title: Text(
                          category.name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          '$entryCount ${entryCount == 1 ? 'entry' : 'entries'}',
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () => _editCategory(category),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete),
                              onPressed: () => _deleteCategory(category),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addCategory,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AddEditCategoryDialog extends StatefulWidget {
  final Category? category;
  final Function(Category) onSave;

  const AddEditCategoryDialog({
    super.key,
    this.category,
    required this.onSave,
  });

  @override
  State<AddEditCategoryDialog> createState() => _AddEditCategoryDialogState();
}

class _AddEditCategoryDialogState extends State<AddEditCategoryDialog> {
  late TextEditingController _nameController;
  late String _selectedColor;
  late String _selectedIcon;

  final List<Map<String, dynamic>> _colors = [
    {'name': 'Red', 'value': '#FFE53935'},
    {'name': 'Pink', 'value': '#FFD81B60'},
    {'name': 'Purple', 'value': '#FF8E24AA'},
    {'name': 'Blue', 'value': '#FF1E88E5'},
    {'name': 'Cyan', 'value': '#FF00ACC1'},
    {'name': 'Teal', 'value': '#FF00897B'},
    {'name': 'Green', 'value': '#FF43A047'},
    {'name': 'Orange', 'value': '#FFFB8C00'},
    {'name': 'Brown', 'value': '#FF6D4C41'},
    {'name': 'Grey', 'value': '#FF757575'},
  ];

  final List<Map<String, dynamic>> _icons = [
    {'name': 'Category', 'value': 'category'},
    {'name': 'Book', 'value': 'book'},
    {'name': 'Work', 'value': 'work'},
    {'name': 'School', 'value': 'school'},
    {'name': 'Translate', 'value': 'translate'},
    {'name': 'Language', 'value': 'language'},
    {'name': 'Chat', 'value': 'chat'},
    {'name': 'Business', 'value': 'business'},
    {'name': 'Medical', 'value': 'medical'},
    {'name': 'Science', 'value': 'science'},
    {'name': 'Food', 'value': 'food'},
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.category?.name ?? '');
    _selectedColor = widget.category?.color ?? _colors[3]['value'];
    _selectedIcon = widget.category?.icon ?? _icons[0]['value'];
  }

  void _save() {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a category name')),
      );
      return;
    }

    final category = Category(
      id: widget.category?.id ?? const Uuid().v4(),
      name: _nameController.text.trim(),
      color: _selectedColor,
      icon: _selectedIcon,
      createdAt: widget.category?.createdAt ?? DateTime.now(),
    );

    widget.onSave(category);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.category == null ? 'Add Category' : 'Edit Category'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Category Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Color',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _colors.map((colorData) {
                final isSelected = _selectedColor == colorData['value'];
                final color = Color(int.parse(
                    colorData['value'].replaceFirst('#', '0xFF')));

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedColor = colorData['value'];
                    });
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: isSelected
                          ? Border.all(color: Colors.black, width: 3)
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white)
                        : null,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text(
              'Icon',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _icons.map((iconData) {
                final isSelected = _selectedIcon == iconData['value'];

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedIcon = iconData['value'];
                    });
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primaryContainer
                          : Theme.of(context).colorScheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected
                          ? Border.all(
                              color: Theme.of(context).colorScheme.primary,
                              width: 2)
                          : null,
                    ),
                    child: Icon(
                      _getIconData(iconData['value']),
                      color: isSelected
                          ? Theme.of(context).colorScheme.onPrimaryContainer
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: const Text('Save'),
        ),
      ],
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'book':
        return Icons.book;
      case 'work':
        return Icons.work;
      case 'school':
        return Icons.school;
      case 'translate':
        return Icons.translate;
      case 'language':
        return Icons.language;
      case 'chat':
        return Icons.chat;
      case 'business':
        return Icons.business;
      case 'medical':
        return Icons.medical_services;
      case 'science':
        return Icons.science;
      case 'food':
        return Icons.restaurant;
      default:
        return Icons.category;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }
}
