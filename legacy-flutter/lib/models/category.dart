import 'package:flutter/material.dart';

class Category {
  final String id;
  final String name;
  final String color; // Hex color string
  final String icon; // Icon name or code
  final DateTime createdAt;

  Category({
    required this.id,
    required this.name,
    required this.color,
    required this.icon,
    required this.createdAt,
  });

  // Convert Category to Map for database
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'color': color,
      'icon': icon,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Create Category from Map (from database)
  factory Category.fromMap(Map<String, dynamic> map) {
    return Category(
      id: map['id'] as String,
      name: map['name'] as String,
      color: map['color'] as String,
      icon: map['icon'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  // Convert Category to JSON for export
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'color': color,
      'icon': icon,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Create Category from JSON (for import)
  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      name: json['name'] as String,
      color: json['color'] as String,
      icon: json['icon'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  // Get Color object from hex string
  Color getColor() {
    return Color(int.parse(color.replaceFirst('#', '0xFF')));
  }

  // Get IconData from icon string
  IconData getIcon() {
    // Simple mapping, can be expanded
    switch (icon) {
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

  // Copy with method for updates
  Category copyWith({
    String? id,
    String? name,
    String? color,
    String? icon,
    DateTime? createdAt,
  }) {
    return Category(
      id: id ?? this.id,
      name: name ?? this.name,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
