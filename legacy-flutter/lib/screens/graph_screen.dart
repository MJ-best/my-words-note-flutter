import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:graphview/GraphView.dart';
import '../models/entry.dart';
import '../models/relationship.dart';
import '../services/database_service.dart';
import 'entry_detail_screen.dart';
import 'dart:math' as math;

class GraphScreen extends StatefulWidget {
  const GraphScreen({super.key});

  @override
  State<GraphScreen> createState() => _GraphScreenState();
}

class _GraphScreenState extends State<GraphScreen> {
  final DatabaseService _db = DatabaseService.instance;
  final Graph graph = Graph()..isTree = false;

  Map<String, Entry> _entries = {};
  List<Relationship> _relationships = [];
  bool _isLoading = true;
  String? _selectedNodeId;

  // Graph layout configuration
  BuchheimWalkerConfiguration builder = BuchheimWalkerConfiguration();
  final TransformationController _transformationController = TransformationController();

  // Filter state
  String _selectedCategory = 'All';
  bool _showFavoritesOnly = false;
  Set<String> _selectedRelationshipTypes = {'synonym', 'antonym', 'related', 'broader', 'narrower', 'association'};

  @override
  void initState() {
    super.initState();
    _configureGraph();
    _loadGraphData();
  }

  void _configureGraph() {
    builder
      ..siblingSeparation = 80
      ..levelSeparation = 80
      ..subtreeSeparation = 80
      ..orientation = BuchheimWalkerConfiguration.ORIENTATION_TOP_BOTTOM;
  }

  Future<void> _loadGraphData() async {
    setState(() => _isLoading = true);

    try {
      // Load all entries
      final entries = await _db.getAllEntries();
      final relationships = await _db.getAllRelationships();

      // Filter entries
      List<Entry> filteredEntries = entries;

      if (_selectedCategory != 'All') {
        filteredEntries = filteredEntries
            .where((e) => e.category == _selectedCategory)
            .toList();
      }

      if (_showFavoritesOnly) {
        filteredEntries = filteredEntries.where((e) => e.isFavorite).toList();
      }

      // Build graph
      graph.nodes.clear();
      graph.edges.clear();
      _entries.clear();

      // Add nodes
      for (var entry in filteredEntries) {
        final node = Node.Id(entry.id);
        graph.addNode(node);
        _entries[entry.id] = entry;
      }

      // Filter and add edges
      final filteredRelationships = relationships.where((rel) {
        return _selectedRelationshipTypes.contains(rel.relationshipType) &&
               _entries.containsKey(rel.fromEntryId) &&
               _entries.containsKey(rel.toEntryId);
      }).toList();

      for (var relationship in filteredRelationships) {
        final from = graph.getNodeUsingId(relationship.fromEntryId);
        final to = graph.getNodeUsingId(relationship.toEntryId);

        if (from != null && to != null) {
          graph.addEdge(from, to);
        }
      }

      setState(() {
        _relationships = filteredRelationships;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        _showError('Failed to load graph: $e');
      }
    }
  }

  void _showError(String message) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          CupertinoDialogAction(
            child: const Text('OK'),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  void _showFilterMenu() {
    HapticFeedback.selectionClick();

    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Graph Filters'),
        message: const Text('Customize what appears in the graph'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _showCategoryFilter();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.square_grid_2x2),
                const SizedBox(width: 8),
                Text('Category: $_selectedCategory'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _showFavoritesOnly = !_showFavoritesOnly;
              });
              _loadGraphData();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _showFavoritesOnly ? CupertinoIcons.heart_fill : CupertinoIcons.heart,
                  color: _showFavoritesOnly ? CupertinoColors.systemRed : null,
                ),
                const SizedBox(width: 8),
                Text(_showFavoritesOnly ? 'Show All' : 'Favorites Only'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _showRelationshipTypeFilter();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.link),
                const SizedBox(width: 8),
                Text('Relationships (${_selectedRelationshipTypes.length})'),
              ],
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _showCategoryFilter() async {
    final categories = await _db.getAllCategories();

    if (!mounted) return;

    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: const Text('Filter by Category'),
        actions: [
          CupertinoActionSheetAction(
            isDefaultAction: _selectedCategory == 'All',
            onPressed: () {
              setState(() => _selectedCategory = 'All');
              Navigator.pop(context);
              _loadGraphData();
            },
            child: const Text('All Categories'),
          ),
          ...categories.map((category) {
            return CupertinoActionSheetAction(
              isDefaultAction: _selectedCategory == category.name,
              onPressed: () {
                setState(() => _selectedCategory = category.name);
                Navigator.pop(context);
                _loadGraphData();
              },
              child: Text(category.name),
            );
          }),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _showRelationshipTypeFilter() {
    final allTypes = ['synonym', 'antonym', 'related', 'broader', 'narrower', 'association'];

    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Relationship Types'),
        content: StatefulBuilder(
          builder: (context, setDialogState) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: allTypes.map((type) {
                final isSelected = _selectedRelationshipTypes.contains(type);
                return CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    setDialogState(() {
                      if (isSelected) {
                        _selectedRelationshipTypes.remove(type);
                      } else {
                        _selectedRelationshipTypes.add(type);
                      }
                    });
                  },
                  child: Row(
                    children: [
                      Icon(
                        isSelected ? CupertinoIcons.check_mark_circled_solid : CupertinoIcons.circle,
                        color: isSelected ? CupertinoColors.systemBlue : CupertinoColors.systemGrey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        RelationshipType.getDisplayName(type),
                        style: TextStyle(
                          color: isSelected ? CupertinoColors.label : CupertinoColors.secondaryLabel,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () {
              Navigator.pop(context);
              setState(() {});
              _loadGraphData();
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _resetZoom() {
    HapticFeedback.selectionClick();
    _transformationController.value = Matrix4.identity();
  }

  void _zoomIn() {
    HapticFeedback.selectionClick();
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    final newScale = (currentScale * 1.2).clamp(0.5, 3.0);
    _transformationController.value = Matrix4.identity()..scale(newScale);
  }

  void _zoomOut() {
    HapticFeedback.selectionClick();
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    final newScale = (currentScale / 1.2).clamp(0.5, 3.0);
    _transformationController.value = Matrix4.identity()..scale(newScale);
  }

  Color _getNodeColor(Entry entry) {
    if (_selectedNodeId == entry.id) {
      return CupertinoColors.systemBlue;
    }
    if (entry.isFavorite) {
      return CupertinoColors.systemRed;
    }
    // Generate color based on category
    return _getCategoryColor(entry.category);
  }

  Color _getCategoryColor(String category) {
    final hash = category.hashCode;
    final hue = (hash % 360).toDouble();
    return HSLColor.fromAHSL(1.0, hue, 0.7, 0.5).toColor();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 44,
              onPressed: _showFilterMenu,
              child: const Icon(CupertinoIcons.slider_horizontal_3),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 44,
              onPressed: _loadGraphData,
              child: const Icon(CupertinoIcons.refresh),
            ),
          ],
        ),
        border: null,
      ),
      child: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            // Large title
            const CupertinoSliverNavigationBar(
              largeTitle: Text('Knowledge Graph'),
              border: null,
            ),

            // Graph content
            SliverFillRemaining(
              child: _isLoading
                  ? const Center(child: CupertinoActivityIndicator(radius: 20))
                  : graph.nodeCount() == 0
                      ? _buildEmptyState()
                      : Stack(
                          children: [
                            // Graph view
                            InteractiveViewer(
                              transformationController: _transformationController,
                              boundaryMargin: const EdgeInsets.all(200),
                              minScale: 0.5,
                              maxScale: 3.0,
                              constrained: false,
                              child: GraphView(
                                graph: graph,
                                algorithm: BuchheimWalkerAlgorithm(
                                  builder,
                                  TreeEdgeRenderer(builder),
                                ),
                                paint: Paint()
                                  ..color = CupertinoColors.systemBlue
                                  ..strokeWidth = 2
                                  ..style = PaintingStyle.stroke,
                                builder: (Node node) {
                                  final entry = _entries[node.key!.value];
                                  if (entry == null) {
                                    return Container();
                                  }
                                  return _buildNode(entry);
                                },
                              ),
                            ),

                            // Zoom controls
                            Positioned(
                              bottom: 24,
                              right: 16,
                              child: _buildZoomControls(),
                            ),

                            // Graph info
                            Positioned(
                              top: 16,
                              left: 16,
                              child: _buildGraphInfo(),
                            ),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNode(Entry entry) {
    final isSelected = _selectedNodeId == entry.id;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedNodeId = entry.id;
        });
      },
      onLongPress: () {
        HapticFeedback.mediumImpact();
        _showNodeContextMenu(entry);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: _getNodeColor(entry),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? CupertinoColors.white
                : CupertinoColors.white.withOpacity(0.3),
            width: isSelected ? 3 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: CupertinoColors.black.withOpacity(0.2),
              blurRadius: isSelected ? 8 : 4,
              offset: Offset(0, isSelected ? 4 : 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (entry.isFavorite)
                  const Padding(
                    padding: EdgeInsets.only(right: 4),
                    child: Icon(
                      CupertinoIcons.heart_fill,
                      size: 12,
                      color: CupertinoColors.white,
                    ),
                  ),
                Flexible(
                  child: Text(
                    entry.sourceText,
                    style: const TextStyle(
                      color: CupertinoColors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              entry.targetText,
              style: TextStyle(
                color: CupertinoColors.white.withOpacity(0.9),
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  void _showNodeContextMenu(Entry entry) {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: Text(entry.sourceText),
        message: Text(entry.targetText),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                CupertinoPageRoute(
                  builder: (context) => EntryDetailScreen(entry: entry),
                ),
              ).then((_) => _loadGraphData());
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.info_circle),
                const SizedBox(width: 8),
                const Text('View Details'),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _focusOnNode(entry.id);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.zoom_in),
                const SizedBox(width: 8),
                const Text('Focus'),
              ],
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Cancel'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _focusOnNode(String nodeId) {
    // Center and zoom on selected node
    HapticFeedback.selectionClick();
    setState(() {
      _selectedNodeId = nodeId;
    });
    // Could implement animated pan/zoom here
  }

  Widget _buildZoomControls() {
    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CupertinoButton(
            padding: const EdgeInsets.all(12),
            onPressed: _zoomIn,
            child: const Icon(CupertinoIcons.plus, size: 20),
          ),
          Container(
            height: 1,
            color: CupertinoColors.separator,
          ),
          CupertinoButton(
            padding: const EdgeInsets.all(12),
            onPressed: _resetZoom,
            child: const Icon(CupertinoIcons.arrow_counterclockwise, size: 20),
          ),
          Container(
            height: 1,
            color: CupertinoColors.separator,
          ),
          CupertinoButton(
            padding: const EdgeInsets.all(12),
            onPressed: _zoomOut,
            child: const Icon(CupertinoIcons.minus, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildGraphInfo() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context).withOpacity(0.9),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(CupertinoIcons.circle_fill, size: 8, color: CupertinoColors.systemBlue),
              const SizedBox(width: 6),
              Text(
                '${graph.nodeCount()} nodes',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(CupertinoIcons.arrow_right, size: 8, color: CupertinoColors.systemGreen),
              const SizedBox(width: 6),
              Text(
                '${graph.edgeCount()} connections',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    String subtitle;

    if (_showFavoritesOnly) {
      message = 'No Favorite Entries';
      subtitle = 'Add favorites to see them in the graph';
    } else if (_selectedCategory != 'All') {
      message = 'No Entries';
      subtitle = 'No entries in "$_selectedCategory" category';
    } else {
      message = 'No Relationships';
      subtitle = 'Create entries and add relationships to visualize connections';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              CupertinoIcons.graph_square,
              size: 64,
              color: CupertinoColors.systemGrey3,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: CupertinoColors.label,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 15,
                color: CupertinoColors.secondaryLabel,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }
}
