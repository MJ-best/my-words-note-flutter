import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'screens/home_screen_improved.dart';
import 'screens/categories_screen.dart';
import 'screens/graph_screen.dart';
import 'screens/settings_screen.dart';
import 'services/database_service.dart';
import 'providers/entry_provider.dart';
import 'repositories/entry_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (kIsWeb) {
    // Use FFI for web
    databaseFactory = databaseFactoryFfi;
  }

  // Initialize database
  final dbService = DatabaseService.instance;
  await dbService.database;

  runApp(MyApp(databaseService: dbService));
}

class MyApp extends StatelessWidget {
  final DatabaseService databaseService;

  const MyApp({super.key, required this.databaseService});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => EntryProvider(
            repository: EntryRepository(databaseService: databaseService),
          ),
        ),
      ],
      child: CupertinoApp(
        title: 'TransKnowledge',
        debugShowCheckedModeBanner: false,
        theme: const CupertinoThemeData(
          brightness: Brightness.light,
          primaryColor: CupertinoColors.systemBlue,
          textTheme: CupertinoTextThemeData(
            navTitleTextStyle: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: CupertinoColors.label,
            ),
            textStyle: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w400,
              color: CupertinoColors.label,
            ),
          ),
        ),
        home: const MainNavigator(),
      ),
    );
  }
}

class MainNavigator extends StatelessWidget {
  const MainNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.square_grid_2x2),
            label: 'Categories',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.graph_square),
            label: 'Graph',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.settings),
            label: 'Settings',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return CupertinoTabView(
              builder: (context) => const HomeScreenImproved(),
            );
          case 1:
            return CupertinoTabView(
              builder: (context) => const CategoriesScreen(),
            );
          case 2:
            return CupertinoTabView(
              builder: (context) => const GraphScreen(),
            );
          case 3:
            return CupertinoTabView(
              builder: (context) => const SettingsScreen(),
            );
          default:
            return CupertinoTabView(
              builder: (context) => const HomeScreenImproved(),
            );
        }
      },
    );
  }
}
