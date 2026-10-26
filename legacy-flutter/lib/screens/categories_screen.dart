import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/category.dart';
import '../repositories/entry_repository.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final EntryRepository _repository = EntryRepository();
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
      final categories = await _repository.getAllCategories(forceRefresh: true);
      final Map<String, int> counts = {};

      // Count entries per category
      for (final category in categories) {
        final entries = await _repository.getEntriesByCategory(category.name);
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
        showCupertinoDialog(
          context: context,
          builder: (context) => CupertinoAlertDialog(
            title: const Text('Error'),
            content: Text('Error loading categories: $e'),
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

  Future<void> _addCategory() async {
    await showCupertinoDialog(
      context: context,
      builder: (context) => AddEditCategoryDialog(
        onSave: (category) async {
          await _repository.createCategory(category);
          _loadCategories();
        },
      ),
    );
  }

  Future<void> _editCategory(Category category) async {
    await showCupertinoDialog(
      context: context,
      builder: (context) => AddEditCategoryDialog(
        category: category,
        onSave: (updatedCategory) async {
          await _repository.updateCategory(updatedCategory);
          _loadCategories();
        },
      ),
    );
  }

  Future<void> _deleteCategory(Category category) async {
    final entryCount = _entryCounts[category.name] ?? 0;

    if (entryCount > 0) {
      showCupertinoDialog(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          title: const Text('Cannot Delete'),
          content: Text(
              'Cannot delete category with $entryCount entries. Reassign or delete entries first.'),
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

    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Delete Category'),
        content: Text('Delete "${category.name}"?'),
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
      await _repository.deleteCategory(category.id);
      _loadCategories();
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Categories'),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 20))
            : _categories.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          CupertinoIcons.square_grid_2x2,
                          size: 64,
                          color: CupertinoColors.systemGrey3,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No categories yet',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: CupertinoColors.label,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Tap + to create your first category',
                          style: TextStyle(
                            fontSize: 15,
                            color: CupertinoColors.secondaryLabel,
                          ),
                        ),
                        const SizedBox(height: 24),
                        CupertinoButton.filled(
                          onPressed: _addCategory,
                          child: const Text('Add Category'),
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      Expanded(
                        child: CustomScrollView(
                          slivers: [
                            CupertinoSliverRefreshControl(
                              onRefresh: _loadCategories,
                            ),
                            SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final category = _categories[index];
                                  final entryCount =
                                      _entryCounts[category.name] ?? 0;

                                  return Container(
                                    margin: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: CupertinoColors.systemBackground,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: CupertinoColors.separator,
                                        width: 0.5,
                                      ),
                                    ),
                                    child: CupertinoListTile(
                                      leading: Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: category.getColor(),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          category.getIcon(),
                                          color: CupertinoColors.white,
                                          size: 20,
                                        ),
                                      ),
                                      title: Text(
                                        category.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 17,
                                          color: CupertinoColors.label,
                                        ),
                                      ),
                                      subtitle: Text(
                                        '$entryCount ${entryCount == 1 ? 'entry' : 'entries'}',
                                        style: const TextStyle(
                                          fontSize: 15,
                                          color: CupertinoColors.secondaryLabel,
                                        ),
                                      ),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          CupertinoButton(
                                            padding: EdgeInsets.zero,
                                            minSize: 44,
                                            onPressed: () =>
                                                _editCategory(category),
                                            child: const Icon(
                                              CupertinoIcons.pencil,
                                              size: 22,
                                            ),
                                          ),
                                          CupertinoButton(
                                            padding: EdgeInsets.zero,
                                            minSize: 44,
                                            onPressed: () =>
                                                _deleteCategory(category),
                                            child: const Icon(
                                              CupertinoIcons.delete,
                                              color: CupertinoColors.systemGrey,
                                              size: 22,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                                childCount: _categories.length,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: CupertinoButton.filled(
                            padding: EdgeInsets.zero,
                            onPressed: _addCategory,
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(CupertinoIcons.add, size: 20),
                                SizedBox(width: 8),
                                Text('Add Category'),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
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
      showCupertinoDialog(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          content: const Text('Please enter a category name'),
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
    return CupertinoAlertDialog(
      title: Text(widget.category == null ? 'Add Category' : 'Edit Category'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            CupertinoTextField(
              controller: _nameController,
              placeholder: 'Category Name',
              padding: const EdgeInsets.all(12),
            ),
            const SizedBox(height: 16),
            const Text(
              'Color',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
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
                          ? Border.all(color: CupertinoColors.black, width: 3)
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(CupertinoIcons.check,
                            color: CupertinoColors.white)
                        : null,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            const Text(
              'Icon',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
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
                          ? CupertinoColors.systemBlue
                          : CupertinoColors.systemGrey6,
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected
                          ? Border.all(
                              color: CupertinoColors.systemBlue, width: 2)
                          : null,
                    ),
                    child: Icon(
                      _getIconData(iconData['value']),
                      color: isSelected
                          ? CupertinoColors.white
                          : CupertinoColors.label,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
      actions: [
        CupertinoDialogAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
        CupertinoDialogAction(
          isDefaultAction: true,
          onPressed: _save,
          child: const Text('Save'),
        ),
      ],
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'book':
        return CupertinoIcons.book;
      case 'work':
        return CupertinoIcons.briefcase;
      case 'school':
        return CupertinoIcons.book_solid;
      case 'translate':
        return CupertinoIcons.textformat_abc;
      case 'language':
        return CupertinoIcons.globe;
      case 'chat':
        return CupertinoIcons.chat_bubble;
      case 'business':
        return CupertinoIcons.building_2_fill;
      case 'medical':
        return CupertinoIcons.heart_fill;
      case 'science':
        return CupertinoIcons.lab_flask;
      case 'food':
        return CupertinoIcons.cart;
      default:
        return CupertinoIcons.square_grid_2x2;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }
}
