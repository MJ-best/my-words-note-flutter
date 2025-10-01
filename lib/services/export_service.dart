import 'dart:convert';
import 'dart:io';
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/entry.dart';
import '../models/relationship.dart';
import '../models/category.dart';
import 'database_service.dart';

class ExportService {
  final DatabaseService _db = DatabaseService.instance;

  // ==================== JSON Export ====================

  Future<String> exportToJson() async {
    // Get all data
    final entries = await _db.getAllEntries();
    final relationships = await _db.getAllRelationships();
    final categories = await _db.getAllCategories();

    // Create export structure
    final exportData = {
      'version': '1.0',
      'exportDate': DateTime.now().toIso8601String(),
      'entries': entries.map((e) => e.toJson()).toList(),
      'relationships': relationships.map((r) => r.toJson()).toList(),
      'categories': categories.map((c) => c.toJson()).toList(),
    };

    // Convert to JSON string
    return const JsonEncoder.withIndent('  ').convert(exportData);
  }

  Future<File> saveJsonToFile(String jsonContent) async {
    final directory = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${directory.path}/transknowledge_export_$timestamp.json');
    return await file.writeAsString(jsonContent);
  }

  Future<void> exportAndShareJson() async {
    try {
      final jsonContent = await exportToJson();
      final file = await saveJsonToFile(jsonContent);
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'TransKnowledge Export',
        text: 'My TransKnowledge data export',
      );
    } catch (e) {
      throw Exception('Failed to export JSON: $e');
    }
  }

  // ==================== CSV Export ====================

  Future<String> exportToCsv() async {
    final entries = await _db.getAllEntries();

    // Define CSV headers
    final List<List<dynamic>> rows = [
      [
        'ID',
        'Type',
        'Source Text',
        'Target Text',
        'Source Language',
        'Target Language',
        'Category',
        'Tags',
        'Pronunciation',
        'Context',
        'Notes',
        'Difficulty Level',
        'Frequency',
        'Source Reference',
        'Is Favorite',
        'Created At',
        'Updated At',
      ]
    ];

    // Add entry data
    for (final entry in entries) {
      rows.add([
        entry.id,
        entry.type,
        entry.sourceText,
        entry.targetText,
        entry.sourceLanguage,
        entry.targetLanguage,
        entry.category,
        entry.tags.join('; '),
        entry.pronunciation ?? '',
        entry.context ?? '',
        entry.notes ?? '',
        entry.difficultyLevel ?? '',
        entry.frequency ?? '',
        entry.sourceReference ?? '',
        entry.isFavorite ? 'Yes' : 'No',
        entry.createdAt.toIso8601String(),
        entry.updatedAt.toIso8601String(),
      ]);
    }

    return const ListToCsvConverter().convert(rows);
  }

  Future<File> saveCsvToFile(String csvContent) async {
    final directory = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${directory.path}/transknowledge_export_$timestamp.csv');
    return await file.writeAsString(csvContent);
  }

  Future<void> exportAndShareCsv() async {
    try {
      final csvContent = await exportToCsv();
      final file = await saveCsvToFile(csvContent);
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'TransKnowledge Export',
        text: 'My TransKnowledge data export (CSV)',
      );
    } catch (e) {
      throw Exception('Failed to export CSV: $e');
    }
  }

  // ==================== Filtered Export ====================

  Future<String> exportCategoriesToJson(List<String> categoryNames) async {
    final entries = <Entry>[];
    for (final categoryName in categoryNames) {
      entries.addAll(await _db.getEntriesByCategory(categoryName));
    }

    final exportData = {
      'version': '1.0',
      'exportDate': DateTime.now().toIso8601String(),
      'filterType': 'categories',
      'filterValues': categoryNames,
      'entries': entries.map((e) => e.toJson()).toList(),
    };

    return const JsonEncoder.withIndent('  ').convert(exportData);
  }

  Future<String> exportFavoritesToJson() async {
    final entries = await _db.getFavoriteEntries();

    final exportData = {
      'version': '1.0',
      'exportDate': DateTime.now().toIso8601String(),
      'filterType': 'favorites',
      'entries': entries.map((e) => e.toJson()).toList(),
    };

    return const JsonEncoder.withIndent('  ').convert(exportData);
  }

  // ==================== Plain Text Export ====================

  Future<String> exportToPlainText() async {
    final entries = await _db.getAllEntries();
    final buffer = StringBuffer();

    buffer.writeln('TransKnowledge Export');
    buffer.writeln('Date: ${DateTime.now().toIso8601String()}');
    buffer.writeln('Total Entries: ${entries.length}');
    buffer.writeln('=' * 50);
    buffer.writeln();

    // Group by category
    final Map<String, List<Entry>> categorizedEntries = {};
    for (final entry in entries) {
      if (!categorizedEntries.containsKey(entry.category)) {
        categorizedEntries[entry.category] = [];
      }
      categorizedEntries[entry.category]!.add(entry);
    }

    // Write each category
    for (final category in categorizedEntries.keys) {
      buffer.writeln('Category: $category');
      buffer.writeln('-' * 50);

      for (final entry in categorizedEntries[category]!) {
        buffer.writeln('${entry.sourceText} → ${entry.targetText}');
        if (entry.pronunciation != null) {
          buffer.writeln('  Pronunciation: ${entry.pronunciation}');
        }
        if (entry.context != null) {
          buffer.writeln('  Context: ${entry.context}');
        }
        if (entry.notes != null) {
          buffer.writeln('  Notes: ${entry.notes}');
        }
        if (entry.tags.isNotEmpty) {
          buffer.writeln('  Tags: ${entry.tags.join(", ")}');
        }
        buffer.writeln();
      }
      buffer.writeln();
    }

    return buffer.toString();
  }

  Future<File> savePlainTextToFile(String content) async {
    final directory = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${directory.path}/transknowledge_export_$timestamp.txt');
    return await file.writeAsString(content);
  }

  Future<void> exportAndSharePlainText() async {
    try {
      final content = await exportToPlainText();
      final file = await savePlainTextToFile(content);
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'TransKnowledge Export',
        text: 'My TransKnowledge data export (Text)',
      );
    } catch (e) {
      throw Exception('Failed to export plain text: $e');
    }
  }
}
