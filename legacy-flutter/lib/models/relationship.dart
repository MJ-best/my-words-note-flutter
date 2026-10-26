class Relationship {
  final String id;
  final String fromEntryId;
  final String toEntryId;
  final String relationshipType; // synonym, antonym, hypernym, hyponym, related, contextual
  final DateTime createdAt;

  Relationship({
    required this.id,
    required this.fromEntryId,
    required this.toEntryId,
    required this.relationshipType,
    required this.createdAt,
  });

  // Convert Relationship to Map for database
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'from_entry_id': fromEntryId,
      'to_entry_id': toEntryId,
      'relationship_type': relationshipType,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Create Relationship from Map (from database)
  factory Relationship.fromMap(Map<String, dynamic> map) {
    return Relationship(
      id: map['id'] as String,
      fromEntryId: map['from_entry_id'] as String,
      toEntryId: map['to_entry_id'] as String,
      relationshipType: map['relationship_type'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  // Convert Relationship to JSON for export
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fromEntryId': fromEntryId,
      'toEntryId': toEntryId,
      'relationshipType': relationshipType,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Create Relationship from JSON (for import)
  factory Relationship.fromJson(Map<String, dynamic> json) {
    return Relationship(
      id: json['id'] as String,
      fromEntryId: json['fromEntryId'] as String,
      toEntryId: json['toEntryId'] as String,
      relationshipType: json['relationshipType'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

// Relationship type constants
class RelationshipType {
  static const String synonym = 'synonym';
  static const String antonym = 'antonym';
  static const String hypernym = 'hypernym'; // broader term
  static const String hyponym = 'hyponym'; // narrower term
  static const String related = 'related';
  static const String contextual = 'contextual';

  static List<String> get all => [
        synonym,
        antonym,
        hypernym,
        hyponym,
        related,
        contextual,
      ];

  static String getDisplayName(String type) {
    switch (type) {
      case synonym:
        return 'Synonym';
      case antonym:
        return 'Antonym';
      case hypernym:
        return 'Broader Term';
      case hyponym:
        return 'Narrower Term';
      case related:
        return 'Related';
      case contextual:
        return 'Contextual';
      default:
        return type;
    }
  }
}
