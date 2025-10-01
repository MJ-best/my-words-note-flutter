class Entry {
  final String id;
  final String type; // word, phrase, term, expression
  final String sourceText;
  final String targetText;
  final String sourceLanguage;
  final String targetLanguage;
  final String category;
  final List<String> tags;
  final String? pronunciation;
  final String? context;
  final String? notes;
  final int? difficultyLevel; // 1-5
  final int? frequency; // 1-5
  final String? sourceReference;
  final bool isFavorite;
  final DateTime createdAt;
  final DateTime updatedAt;

  Entry({
    required this.id,
    required this.type,
    required this.sourceText,
    required this.targetText,
    required this.sourceLanguage,
    required this.targetLanguage,
    required this.category,
    required this.tags,
    this.pronunciation,
    this.context,
    this.notes,
    this.difficultyLevel,
    this.frequency,
    this.sourceReference,
    required this.isFavorite,
    required this.createdAt,
    required this.updatedAt,
  });

  // Convert Entry to Map for database
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'source_text': sourceText,
      'target_text': targetText,
      'source_language': sourceLanguage,
      'target_language': targetLanguage,
      'category': category,
      'tags': tags.join(','),
      'pronunciation': pronunciation,
      'context': context,
      'notes': notes,
      'difficulty_level': difficultyLevel,
      'frequency': frequency,
      'source_reference': sourceReference,
      'is_favorite': isFavorite ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // Create Entry from Map (from database)
  factory Entry.fromMap(Map<String, dynamic> map) {
    return Entry(
      id: map['id'] as String,
      type: map['type'] as String,
      sourceText: map['source_text'] as String,
      targetText: map['target_text'] as String,
      sourceLanguage: map['source_language'] as String,
      targetLanguage: map['target_language'] as String,
      category: map['category'] as String,
      tags: (map['tags'] as String).isEmpty
          ? []
          : (map['tags'] as String).split(','),
      pronunciation: map['pronunciation'] as String?,
      context: map['context'] as String?,
      notes: map['notes'] as String?,
      difficultyLevel: map['difficulty_level'] as int?,
      frequency: map['frequency'] as int?,
      sourceReference: map['source_reference'] as String?,
      isFavorite: map['is_favorite'] == 1,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  // Convert Entry to JSON for export
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'sourceText': sourceText,
      'targetText': targetText,
      'sourceLanguage': sourceLanguage,
      'targetLanguage': targetLanguage,
      'category': category,
      'tags': tags,
      'pronunciation': pronunciation,
      'context': context,
      'notes': notes,
      'difficultyLevel': difficultyLevel,
      'frequency': frequency,
      'sourceReference': sourceReference,
      'isFavorite': isFavorite,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Create Entry from JSON (for import)
  factory Entry.fromJson(Map<String, dynamic> json) {
    return Entry(
      id: json['id'] as String,
      type: json['type'] as String,
      sourceText: json['sourceText'] as String,
      targetText: json['targetText'] as String,
      sourceLanguage: json['sourceLanguage'] as String,
      targetLanguage: json['targetLanguage'] as String,
      category: json['category'] as String,
      tags: List<String>.from(json['tags'] ?? []),
      pronunciation: json['pronunciation'] as String?,
      context: json['context'] as String?,
      notes: json['notes'] as String?,
      difficultyLevel: json['difficultyLevel'] as int?,
      frequency: json['frequency'] as int?,
      sourceReference: json['sourceReference'] as String?,
      isFavorite: json['isFavorite'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  // Copy with method for updates
  Entry copyWith({
    String? id,
    String? type,
    String? sourceText,
    String? targetText,
    String? sourceLanguage,
    String? targetLanguage,
    String? category,
    List<String>? tags,
    String? pronunciation,
    String? context,
    String? notes,
    int? difficultyLevel,
    int? frequency,
    String? sourceReference,
    bool? isFavorite,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Entry(
      id: id ?? this.id,
      type: type ?? this.type,
      sourceText: sourceText ?? this.sourceText,
      targetText: targetText ?? this.targetText,
      sourceLanguage: sourceLanguage ?? this.sourceLanguage,
      targetLanguage: targetLanguage ?? this.targetLanguage,
      category: category ?? this.category,
      tags: tags ?? this.tags,
      pronunciation: pronunciation ?? this.pronunciation,
      context: context ?? this.context,
      notes: notes ?? this.notes,
      difficultyLevel: difficultyLevel ?? this.difficultyLevel,
      frequency: frequency ?? this.frequency,
      sourceReference: sourceReference ?? this.sourceReference,
      isFavorite: isFavorite ?? this.isFavorite,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
