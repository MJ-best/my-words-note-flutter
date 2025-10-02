
# Flutter iOS 스타일 UI/UX 디자인 규칙

Flutter로 iOS 네이티브 경험을 제공하는 앱을 개발하기 위한 포괄적인 디자인 가이드입니다.

---

## 목차

1. [기본 원칙](#기본-원칙)
2. [위젯 선택 가이드](#위젯-선택-가이드)
3. [타이포그래피](#타이포그래피)
4. [컬러 시스템](#컬러-시스템)
5. [레이아웃 & 간격](#레이아웃--간격)
6. [네비게이션 패턴](#네비게이션-패턴)
7. [인터랙션 패턴](#인터랙션-패턴)
8. [플랫폼 적응](#플랫폼-적응)
9. [성능 최적화](#성능-최적화)
10. [일반적인 실수](#일반적인-실수)
11. [체크리스트](#체크리스트)

---

## 기본 원칙

Apple의 디자인 언어를 완벽하게 구현하는 Flutter 앱을 만들려면 Cupertino 위젯 라이브러리, iOS 디자인 철학, 그리고 플랫폼별 최적화를 종합적으로 이해해야 합니다.

### Apple의 3대 디자인 원칙

#### 1. Clarity (명확성)
- **텍스트 크기**: 최소 11pt 이상 사용
- **터치 타겟**: 최소 44x44pt 확보
- **대비**: 텍스트와 배경 간 충분한 대비 유지 (WCAG AA: 4.5:1)
- **계층 구조**: 명확한 시각적 위계 설정
- **레이아웃**: 깨끗하고 정돈된 인터페이스

```dart
// ✅ 올바른 예시
CupertinoButton(
  minSize: 44,  // 최소 터치 타겟
  child: Text('버튼', style: TextStyle(fontSize: 17)),
  onPressed: () {},
)

// ❌ 잘못된 예시
CupertinoButton(
  minSize: 30,  // 너무 작음
  child: Text('버튼', style: TextStyle(fontSize: 9)),  // 너무 작음
  onPressed: () {},
)
```

#### 2. Deference (존중)
- **콘텐츠 우선**: UI가 콘텐츠를 지배하지 않음
- **미니멀리즘**: 불필요한 장식 제거
- **전체 화면**: 상태 표시줄 뒤까지 콘텐츠 확장 가능
- **적응형 색상**: 콘텐츠에 따라 UI 색상 조정

```dart
// ✅ 콘텐츠 중심 디자인
CupertinoPageScaffold(
  navigationBar: CupertinoNavigationBar(
    middle: Text('제목'),
    border: null,  // 불필요한 테두리 제거
    backgroundColor: CupertinoColors.systemBackground.withOpacity(0.9),
  ),
  child: SafeArea(
    child: ContentWidget(),  // 콘텐츠가 주인공
  ),
)
```

#### 3. Depth (깊이)
- **레이어링**: 시각적 레이어로 계층 구조 전달
- **반투명 효과**: 블러로 아래 콘텐츠 표시
- **그림자**: 미묘한 그림자로 고도 표현
- **애니메이션**: 물리적 움직임을 암시하는 전환

```dart
// ✅ 깊이감 있는 모달
showCupertinoModalPopup(
  context: context,
  builder: (context) => Container(
    decoration: BoxDecoration(
      color: CupertinoColors.systemBackground,
      borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      boxShadow: [
        BoxShadow(
          color: CupertinoColors.black.withOpacity(0.1),
          blurRadius: 10,
          offset: Offset(0, -2),
        ),
      ],
    ),
    child: ModalContent(),
  ),
);
```

---

## 위젯 선택 가이드

### CupertinoApp vs MaterialApp

| 기준 | CupertinoApp | MaterialApp |
|------|--------------|-------------|
| **사용 시기** | iOS 전용 또는 iOS 우선 | 크로스 플랫폼 또는 Android 우선 |
| **폰트** | San Francisco (iOS/macOS만) | Roboto (모든 플랫폼) |
| **위젯 성숙도** | 제한적 | 풍부함 |
| **App Store** | 권장 | 허용 |

```dart
// iOS 우선 앱
void main() {
  runApp(
    CupertinoApp(
      theme: CupertinoThemeData(
        primaryColor: CupertinoColors.systemBlue,
      ),
      home: HomePage(),
    ),
  );
}

// 크로스 플랫폼 앱
void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(
        platform: Platform.isIOS ? TargetPlatform.iOS : TargetPlatform.android,
      ),
      home: HomePage(),
    ),
  );
}
```

### 핵심 Cupertino 위젯

#### 1. CupertinoButton

```dart
// 기본 버튼
CupertinoButton(
  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  onPressed: () {},
  child: Text('버튼'),
)

// Filled 버튼 (주요 액션)
CupertinoButton.filled(
  onPressed: () {},
  child: Text('제출'),
)

// NavigationBar 내 버튼
CupertinoButton(
  padding: EdgeInsets.zero,  // 필수!
  onPressed: () {},
  child: Icon(CupertinoIcons.share),
)
```

**규칙**:
- `pressedOpacity`: 기본값 0.4 유지
- NavigationBar 내부에서는 `padding: EdgeInsets.zero` 필수
- 주요 액션에는 `.filled()` 사용

#### 2. CupertinoNavigationBar

```dart
CupertinoPageScaffold(
  navigationBar: CupertinoNavigationBar(
    middle: Text('제목'),
    leading: CupertinoButton(
      padding: EdgeInsets.zero,
      child: Icon(CupertinoIcons.back),
      onPressed: () => Navigator.pop(context),
    ),
    trailing: CupertinoButton(
      padding: EdgeInsets.zero,
      child: Icon(CupertinoIcons.ellipsis),
      onPressed: () {},
    ),
    backgroundColor: CupertinoColors.systemBackground.withOpacity(0.9),
  ),
  child: Content(),
)
```

#### 3. CupertinoTextField

```dart
// 표준 텍스트 필드
CupertinoTextField(
  placeholder: '이메일 입력',
  padding: EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: CupertinoColors.systemGrey6,
    borderRadius: BorderRadius.circular(8),
  ),
  clearButtonMode: OverlayVisibilityMode.editing,
  prefix: Padding(
    padding: EdgeInsets.only(left: 8),
    child: Icon(CupertinoIcons.mail),
  ),
)

// 테두리 없는 변형
CupertinoTextField.borderless(
  placeholder: '검색',
)
```

#### 4. CupertinoAlertDialog & CupertinoActionSheet

```dart
// Alert Dialog (2개 이하 옵션)
showCupertinoDialog(
  context: context,
  builder: (context) => CupertinoAlertDialog(
    title: Text('알림'),
    content: Text('정말 삭제하시겠습니까?'),
    actions: [
      CupertinoDialogAction(
        isDefaultAction: true,
        child: Text('취소'),
        onPressed: () => Navigator.pop(context),
      ),
      CupertinoDialogAction(
        isDestructiveAction: true,
        child: Text('삭제'),
        onPressed: () {
          Navigator.pop(context);
        },
      ),
    ],
  ),
);

// Action Sheet (3개 이상 옵션)
showCupertinoModalPopup(
  context: context,
  builder: (context) => CupertinoActionSheet(
    title: Text('옵션 선택'),
    actions: [
      CupertinoActionSheetAction(
        child: Text('사진 촬영'),
        onPressed: () {},
      ),
      CupertinoActionSheetAction(
        child: Text('사진 선택'),
        onPressed: () {},
      ),
      CupertinoActionSheetAction(
        isDestructiveAction: true,
        child: Text('삭제'),
        onPressed: () {},
      ),
    ],
    cancelButton: CupertinoActionSheetAction(
      child: Text('취소'),
      onPressed: () => Navigator.pop(context),
    ),
  ),
);
```

#### 5. CupertinoSwitch

```dart
CupertinoSwitch(
  value: _switchValue,
  onChanged: (bool value) {
    setState(() {
      _switchValue = value;
    });
  },
  activeColor: CupertinoColors.systemGreen,  // ✅ 최신 API
)
```

#### 6. CupertinoDatePicker

```dart
Container(
  height: 200,
  child: CupertinoDatePicker(
    mode: CupertinoDatePickerMode.date,
    initialDateTime: DateTime.now(),
    minimumDate: DateTime(2000),
    maximumDate: DateTime(2100),
    onDateTimeChanged: (DateTime newDate) {
      setState(() {
        _selectedDate = newDate;
      });
    },
  ),
)
```

#### 7. CupertinoSegmentedControl

```dart
CupertinoSegmentedControl<int>(
  children: {
    0: Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Text('리스트'),
    ),
    1: Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Text('그리드'),
    ),
  },
  groupValue: _selectedSegment,
  onValueChanged: (int value) {
    setState(() {
      _selectedSegment = value;
    });
  },
)
```

---

## 타이포그래피

### iOS 텍스트 스타일

| 스타일 | 크기 | 굵기 | 줄 높이 | 사용처 |
|--------|------|------|---------|--------|
| **Large Title** | 34pt | Bold | 41pt | 큰 페이지 제목 |
| **Title 1** | 28pt | Regular | 34pt | 섹션 제목 |
| **Title 2** | 22pt | Regular | 28pt | 하위 섹션 |
| **Title 3** | 20pt | Regular | 24pt | 그룹 제목 |
| **Headline** | 17pt | Semibold | 22pt | 강조 텍스트 |
| **Body** | 17pt | Regular | 22pt | 기본 본문 |
| **Callout** | 16pt | Regular | 21pt | 보조 본문 |
| **Subheadline** | 15pt | Regular | 20pt | 보조 설명 |
| **Footnote** | 13pt | Regular | 18pt | 주석, 캡션 |
| **Caption 1** | 12pt | Regular | 16pt | 작은 캡션 |
| **Caption 2** | 11pt | Regular | 13pt | 최소 크기 |

### Flutter 구현

```dart
CupertinoApp(
  theme: CupertinoThemeData(
    textTheme: CupertinoTextThemeData(
      navLargeTitleTextStyle: TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.bold,
        letterSpacing: -1.5,
      ),
      navTitleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
      ),
      textStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
      ),
      pickerTextStyle: TextStyle(fontSize: 21),
      dateTimePickerTextStyle: TextStyle(fontSize: 21),
    ),
  ),
)
```

### 텍스트 스타일 사용 예시

```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    // Large Title
    Text(
      '큰 제목',
      style: CupertinoTheme.of(context).textTheme.navLargeTitleTextStyle,
    ),
    SizedBox(height: 16),
    
    // Headline
    Text(
      '헤드라인',
      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
    ),
    SizedBox(height: 8),
    
    // Body
    Text(
      '본문 텍스트입니다.',
      style: CupertinoTheme.of(context).textTheme.textStyle,
    ),
    SizedBox(height: 8),
    
    // Footnote
    Text(
      '주석',
      style: TextStyle(
        fontSize: 13,
        color: CupertinoColors.secondaryLabel,
      ),
    ),
  ],
)
```

### 타이포그래피 규칙

1. **최소 크기**: 10pt (탭 바 라벨만 허용), 일반 텍스트는 최소 11pt
2. **굵기로 강조**: 크기보다 굵기(weight)와 색상으로 계층 구조 표현
3. **보조 텍스트**: 60% 불투명도의 secondaryLabel 사용
4. **Dynamic Type**: 사용자 설정 텍스트 크기 존중

---

## 컬러 시스템

### 시맨틱 컬러

#### 라벨 컬러 (텍스트)

```dart
// 주요 텍스트
Text(
  '제목',
  style: TextStyle(color: CupertinoColors.label),
)

// 보조 텍스트 (60% 불투명도)
Text(
  '설명',
  style: TextStyle(color: CupertinoColors.secondaryLabel),
)

// 삼차 텍스트 (30% 불투명도)
Text(
  '부가 정보',
  style: TextStyle(color: CupertinoColors.tertiaryLabel),
)

// 네 번째 수준 (18% 불투명도)
Text(
  '비활성 텍스트',
  style: TextStyle(color: CupertinoColors.quaternaryLabel),
)
```

#### Fill 컬러 (UI 요소)

```dart
// 얇고 작은 모양
Container(
  decoration: BoxDecoration(
    color: CupertinoColors.systemFill,
    borderRadius: BorderRadius.circular(8),
  ),
)

// 입력 필드, 검색 바
CupertinoTextField(
  decoration: BoxDecoration(
    color: CupertinoColors.tertiarySystemFill,
  ),
)
```

#### 배경 컬러

```dart
// Stack 1: 표준 배경
CupertinoPageScaffold(
  backgroundColor: CupertinoColors.systemBackground,  // 주요 배경
  child: Container(
    color: CupertinoColors.secondarySystemBackground,  // 레이어드 콘텐츠
  ),
)

// Stack 2: 그룹화된 배경 (설정 화면 등)
Container(
  color: CupertinoColors.systemGroupedBackground,
  child: Container(
    color: CupertinoColors.secondarySystemGroupedBackground,
  ),
)
```

#### 액센트 컬러

```dart
// iOS 시스템 컬러
final colors = {
  'Blue': CupertinoColors.systemBlue,      // 기본 상호작용
  'Green': CupertinoColors.systemGreen,
  'Indigo': CupertinoColors.systemIndigo,
  'Orange': CupertinoColors.systemOrange,
  'Pink': CupertinoColors.systemPink,
  'Purple': CupertinoColors.systemPurple,
  'Red': CupertinoColors.systemRed,
  'Teal': CupertinoColors.systemTeal,
  'Yellow': CupertinoColors.systemYellow,
};
```

### 다크 모드 구현

```dart
// 앱 레벨 다크 모드
CupertinoApp(
  theme: CupertinoThemeData(
    brightness: Brightness.light,
    primaryColor: CupertinoColors.systemBlue,
  ),
  darkTheme: CupertinoThemeData(
    brightness: Brightness.dark,
    primaryColor: CupertinoColors.systemBlue,
  ),
  home: HomePage(),
)

// 커스텀 적응형 컬러
final adaptiveColor = CupertinoDynamicColor(
  color: Color(0xFF007AFF),                    // 라이트 모드
  darkColor: Color(0xFF0A84FF),                // 다크 모드
  highContrastColor: Color(0xFF0040DD),        // 라이트 고대비
  darkHighContrastColor: Color(0xFF409CFF),    // 다크 고대비
);
```

### 컬러 규칙

1. **하드코딩 금지**: `Color(0xFF...)` 대신 시맨틱 컬러 사용
2. **대비 비율**: 텍스트 4.5:1, 큰 텍스트 3:1 이상 (WCAG AA)
3. **다크 모드**: 모든 컬러는 자동 적응되어야 함
4. **고도 표현**: 다크 모드에서 밝을수록 사용자에게 가까움

---

## 레이아웃 & 간격

### 8pt 그리드 시스템

```dart
// 기본 간격 단위
const double spacing1 = 8.0;   // 1x
const double spacing2 = 16.0;  // 2x
const double spacing3 = 24.0;  // 3x
const double spacing4 = 32.0;  // 4x
const double spacing5 = 44.0;  // 5x (최소 터치 타겟)

// 사용 예시
Column(
  children: [
    Widget1(),
    SizedBox(height: spacing2),  // 16pt 간격
    Widget2(),
    SizedBox(height: spacing3),  // 24pt 간격
    Widget3(),
  ],
)
```

### 화면 여백

```dart
// 기본 패딩: 16pt
Container(
  padding: EdgeInsets.all(16),
  child: Content(),
)

// 가로 여백만
Container(
  padding: EdgeInsets.symmetric(horizontal: 16),
  child: Content(),
)
```

### 화면 구조 측정치

```dart
// 네비게이션 바 높이
const double navBarHeight = 44.0;
const double largeNavBarHeight = 102.0;  // 큰 제목 포함

// 탭 바 높이
const double tabBarHeight = 49.0;  // iPhone 세로
const double tabBarHeightWithIndicator = 83.0;  // 홈 인디케이터 포함

// Safe Area 사용
SafeArea(
  child: Column(
    children: [
      Header(),
      Expanded(child: Content()),
      Footer(),
    ],
  ),
)
```

### 터치 타겟

```dart
// 최소 터치 타겟: 44x44pt
CupertinoButton(
  minSize: 44,  // ✅ 필수
  padding: EdgeInsets.zero,
  child: Icon(CupertinoIcons.heart),
  onPressed: () {},
)
```

---

## 네비게이션 패턴

### 탭 바 네비게이션

```dart
CupertinoTabScaffold(
  tabBar: CupertinoTabBar(
    items: [
      BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.home),
        label: '홈',
      ),
      BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.search),
        label: '검색',
      ),
      BottomNavigationBarItem(
        icon: Icon(CupertinoIcons.person),
        label: '프로필',
      ),
    ],
  ),
  tabBuilder: (context, index) {
    switch (index) {
      case 0:
        return CupertinoTabView(builder: (context) => HomePage());
      case 1:
        return CupertinoTabView(builder: (context) => SearchPage());
      case 2:
        return CupertinoTabView(builder: (context) => ProfilePage());
      default:
        return Container();
    }
  },
)
```

**탭 바 규칙**:
- 2~5개 탭 (5개 초과 시 "더보기" 탭 사용)
- 항상 화면 하단 고정
- 액션 트리거 금지 (네비게이션만)

### 페이지 전환

```dart
// iOS 스타일 슬라이드 전환
Navigator.push(
  context,
  CupertinoPageRoute(
    builder: (context) => DetailPage(),
  ),
);

// 풀스크린 모달 (하단에서 위로)
Navigator.push(
  context,
  CupertinoPageRoute(
    fullscreenDialog: true,
    builder: (context) => ModalPage(),
  ),
);
```

### Hero 애니메이션

```dart
// 리스트 화면
Hero(
  tag: 'image-${item.id}',
  child: Image.network(item.imageUrl),
)

// 상세 화면
Hero(
  tag: 'image-${item.id}',
  transitionOnUserGestures: true,  // 뒤로 스와이프 지원
  child: Image.network(item.imageUrl),
)
```

---

## 인터랙션 패턴

### 스와이프 제스처

```dart
// 뒤로 스와이프 (자동 지원)
CupertinoPageRoute(
  builder: (context) => NextPage(),
)

// 커스텀 스와이프
Dismissible(
  key: Key(item.id),
  direction: DismissDirection.endToStart,
  background: Container(
    alignment: Alignment.centerRight,
    padding: EdgeInsets.only(right: 16),
    color: CupertinoColors.systemRed,
    child: Icon(CupertinoIcons.delete, color: CupertinoColors.white),
  ),
  onDismissed: (direction) {
    // 삭제 로직
  },
  child: ListTile(title: Text(item.name)),
)
```

### Pull-to-Refresh

```dart
CustomScrollView(
  slivers: [
    CupertinoSliverRefreshControl(
      onRefresh: () async {
        await Future.delayed(Duration(seconds: 2));
      },
    ),
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => ListTile(title: Text('아이템 $index')),
        childCount: items.length,
      ),
    ),
  ],
)
```

**사용 시나리오**:
- ✅ 최신순 정렬 리스트
- ✅ 소셜 피드, 이메일
- ❌ 지도, 순서 없는 리스트

### 컨텍스트 메뉴

```dart
CupertinoContextMenu(
  actions: [
    CupertinoContextMenuAction(
      child: Text('공유'),
      trailingIcon: CupertinoIcons.share,
      onPressed: () {
        Navigator.pop(context);
      },
    ),
    CupertinoContextMenuAction(
      isDestructiveAction: true,
      child: Text('삭제'),
      trailingIcon: CupertinoIcons.delete,
      onPressed: () {
        Navigator.pop(context);
      },
    ),
  ],
  child: Container(
    padding: EdgeInsets.all(16),
    child: Image.network(imageUrl),
  ),
)
```

### 햅틱 피드백

```dart
import 'package:flutter/services.dart';

// 알림 피드백
HapticFeedback.notificationOccurred(NotificationFeedbackType.success);
HapticFeedback.notificationOccurred(NotificationFeedbackType.warning);
HapticFeedback.notificationOccurred(NotificationFeedbackType.error);

// 충격 피드백
HapticFeedback.lightImpact();
HapticFeedback.mediumImpact();
HapticFeedback.heavyImpact();

// 선택 피드백
HapticFeedback.selectionClick();

// 사용 예시
CupertinoButton(
  onPressed: () {
    HapticFeedback.lightImpact();
    // 액션 실행
  },
  child: Text('제출'),
)
```

**햅틱 사용 원칙**:
- ✅ 버튼 터치, 스위치 토글
- ✅ 성공/실패 알림
- ✅ 선택 변경
- ❌ 스크롤 중 과도한 사용
- ❌ 저전력 모드 무시

---

## 플랫폼 적응

### 플랫폼 감지 방법

```dart
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show defaultTargetPlatform;

// 방법 1: Platform 클래스 (웹에서 사용 불가)
if (Platform.isIOS) {
  return CupertinoWidget();
} else if (Platform.isAndroid) {
  return MaterialWidget();
}

// 방법 2: defaultTargetPlatform (모든 플랫폼 지원)
if (defaultTargetPlatform == TargetPlatform.iOS) {
  return CupertinoWidget();
} else {
  return MaterialWidget();
}

// 방법 3: Theme.of(context).platform
if (Theme.of(context).platform == TargetPlatform.iOS) {
  return CupertinoWidget();
} else {
  return MaterialWidget();
}
```

### 적응형 위젯 패턴

```dart
// 적응형 버튼
Widget adaptiveButton({
  required VoidCallback onPressed,
  required String text,
}) {
  if (Platform.isIOS) {
    return CupertinoButton.filled(
      onPressed: onPressed,
      child: Text(text),
    );
  } else {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(text),
    );
  }
}

// 적응형 로딩 인디케이터
Widget adaptiveLoading() {
  return Platform.isIOS
      ? const CupertinoActivityIndicator()
      : const CircularProgressIndicator();
}

// 적응형 다이얼로그
Future<void> showAdaptiveDialog(
  BuildContext context, {
  required String title,
  required String content,
  required VoidCallback onConfirm,
}) {
  if (Platform.isIOS) {
    return showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          CupertinoDialogAction(
            child: const Text('취소'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('확인'),
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
          ),
        ],
      ),
    );
  } else {
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }
}
```

### Flutter 내장 적응형 위젯

```dart
// 스위치
Switch.adaptive(
  value: _value,
  onChanged: (value) => setState(() => _value = value),
)

// 슬라이더
Slider.adaptive(
  value: _sliderValue,
  onChanged: (value) => setState(() => _sliderValue = value),
)

// 로딩 인디케이터
CircularProgressIndicator.adaptive()

// 체크박스
Checkbox.adaptive(
  value: _checked,
  onChanged: (value) => setState(() => _checked = value!),
)

// 아이콘
Icon(Icons.adaptive.share)  // iOS: share, Android: share
```

### iOS 우선 크로스 플랫폼 전략

```dart
// iOS 스타일 우선, Material에서 iOS 느낌 적용
MaterialApp(
  theme: ThemeData(
    // iOS 플랫폼 설정
    platform: Platform.isIOS ? TargetPlatform.iOS : TargetPlatform.android,
    
    // iOS 스타일 텍스트 테마
    textTheme: Platform.isIOS ? TextTheme(
      headlineMedium: CupertinoThemeData()
        .textTheme
        .navLargeTitleTextStyle
        .copyWith(letterSpacing: -1.5),
      titleLarge: CupertinoThemeData().textTheme.navTitleTextStyle,
    ) : null,
    
    // iOS 스타일 페이지 전환
    pageTransitionsTheme: PageTransitionsTheme(
      builders: {
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.android: CupertinoPageTransitionsBuilder(),
      },
    ),
  ),
)
```

---

## 성능 최적화

### const 생성자 사용

```dart
// ✅ 올바른 예시 - const 사용
class MyWidget extends StatelessWidget {
  const MyWidget({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Text('제목'),
        SizedBox(height: 16),
        Text('본문'),
      ],
    );
  }
}

// ❌ 잘못된 예시 - const 미사용
Widget build(BuildContext context) {
  return Column(  // 매 리빌드마다 새로 생성
    children: [
      Text('제목'),
      SizedBox(height: 16),
      Text('본문'),
    ],
  );
}
```

### 이미지 최적화

```dart
// 캐시된 네트워크 이미지
import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => CupertinoActivityIndicator(),
  errorWidget: (context, url, error) => Icon(CupertinoIcons.exclamationmark_triangle),
  memCacheWidth: 1000,
  memCacheHeight: 1000,
)

// 해상도 제한 (메모리 절약)
Image.network(
  imageUrl,
  cacheWidth: 600,
  cacheHeight: 400,
)
```

### 리스트 최적화

```dart
// ✅ ListView.builder 사용 (지연 로딩)
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(title: Text(items[index]));
  },
)

// ❌ ListView(children: [...]) 사용 금지
ListView(
  children: items.map((item) => ListTile(title: Text(item))).toList(),
)

// 고정 높이가 있는 경우 itemExtent 지정
ListView.builder(
  itemCount: items.length,
  itemExtent: 60.0,  // 성능 향상
  itemBuilder: (context, index) => ListTile(title: Text(items[index])),
)
```

### 상태 관리 최적화

```dart
// ✅ 올바른 상태 관리 - 필요한 부분만 리빌드
class CounterWidget extends StatefulWidget {
  const CounterWidget({Key? key}) : super(key: key);

  @override
  State<CounterWidget> createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int _counter = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('고정 텍스트'),  // const로 리빌드 방지
        Text('카운터: $_counter'),  // 동적 부분만 리빌드
        CupertinoButton(
          onPressed: () => setState(() => _counter++),
          child: const Text('증가'),
        ),
      ],
    );
  }
}
```

### Cupertino 특정 최적화

```dart
// NavigationBar 최적화
CupertinoNavigationBar(
  transitionBetweenRoutes: false,  // Hero 전환 불필요 시 비활성화
  middle: const Text('제목'),      // const 사용
)

// DatePicker 최적화
CupertinoDatePicker(
  mode: CupertinoDatePickerMode.date,
  minimumYear: 2000,  // 범위 제한으로 성능 향상
  maximumYear: 2100,
  onDateTimeChanged: (date) {},
)

// SegmentedControl 최적화
CupertinoSegmentedControl<int>(
  children: const {  // const Map 사용
    0: Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Text('옵션 1'),
    ),
    1: Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Text('옵션 2'),
    ),
  },
  groupValue: _selectedSegment,
  onValueChanged: (value) => setState(() => _selectedSegment = value),
)
```

---

## 일반적인 실수

### 1. iOS 적응 없이 Material Design 사용

```dart
// ❌ 잘못된 예시
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: Text('알림'),
    content: Text('내용'),
  ),
);

// ✅ 올바른 예시
if (Platform.isIOS) {
  showCupertinoDialog(
    context: context,
    builder: (context) => CupertinoAlertDialog(
      title: Text('알림'),
      content: Text('내용'),
    ),
  );
} else {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('알림'),
      content: Text('내용'),
    ),
  );
}
```

### 2. 화면 크기 하드코딩

```dart
// ❌ 잘못된 예시
Container(
  width: 300,
  height: 400,
  child: Content(),
)

// ✅ 올바른 예시
Container(
  width: MediaQuery.of(context).size.width * 0.8,
  height: MediaQuery.of(context).size.height * 0.5,
  child: Content(),
)
```

### 3. 다크 모드 미지원

```dart
// ❌ 잘못된 예시 - 하드코딩된 색상
Container(
  color: Colors.white,
  child: Text(
    '텍스트',
    style: TextStyle(color: Colors.black),
  ),
)

// ✅ 올바른 예시 - 시맨틱 컬러
Container(
  color: CupertinoColors.systemBackground,
  child: Text(
    '텍스트',
    style: TextStyle(color: CupertinoColors.label),
  ),
)
```

### 4. SafeArea 무시

```dart
// ❌ 잘못된 예시 - 노치/홈 인디케이터에 가려짐
Scaffold(
  body: Column(
    children: [
      Header(),
      Expanded(child: Content()),
      Footer(),
    ],
  ),
)

// ✅ 올바른 예시
Scaffold(
  body: SafeArea(
    child: Column(
      children: [
        Header(),
        Expanded(child: Content()),
        Footer(),
      ],
    ),
  ),
)
```

### 5. setState() 과다 사용

```dart
// ❌ 잘못된 예시 - 전체 위젯 리빌드
class _MyWidgetState extends State<MyWidget> {
  int _counter = 0;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ExpensiveWidget1(),  // 불필요하게 리빌드
        ExpensiveWidget2(),  // 불필요하게 리빌드
        Text('$_counter'),
        CupertinoButton(
          onPressed: () => setState(() => _counter++),
          child: Text('증가'),
        ),
      ],
    );
  }
}

// ✅ 올바른 예시 - 상태 관리 라이브러리 사용
import 'package:provider/provider.dart';

class Counter with ChangeNotifier {
  int _value = 0;
  int get value => _value;
  
  void increment() {
    _value++;
    notifyListeners();
  }
}

// 필요한 부분만 리빌드
Consumer<Counter>(
  builder: (context, counter, child) => Text('${counter.value}'),
)
```

### 6. 접근성 무시

```dart
// ❌ 잘못된 예시
Image.network(imageUrl)

CupertinoButton(
  onPressed: () {},
  child: Icon(CupertinoIcons.delete),
)

// ✅ 올바른 예시 - 시맨틱 라벨 추가
Semantics(
  label: '프로필 사진',
  child: Image.network(imageUrl),
)

CupertinoButton(
  onPressed: () {},
  child: Semantics(
    label: '삭제',
    button: true,
    child: Icon(CupertinoIcons.delete),
  ),
)
```

### 7. 거대한 모놀리식 위젯

```dart
// ❌ 잘못된 예시 - 500줄 build 메서드
@override
Widget build(BuildContext context) {
  return CupertinoPageScaffold(
    navigationBar: CupertinoNavigationBar(
      middle: Text('제목'),
      // ... 100줄
    ),
    child: Column(
      children: [
        // ... 400줄의 복잡한 UI
      ],
    ),
  );
}

// ✅ 올바른 예시 - 작은 컴포넌트로 분할
@override
Widget build(BuildContext context) {
  return CupertinoPageScaffold(
    navigationBar: _buildNavigationBar(),
    child: Column(
      children: [
        _HeaderSection(),
        _ContentSection(),
        _FooterSection(),
      ],
    ),
  );
}
```

---

## 체크리스트

### 높은 우선순위 (필수)

#### 플랫폼 적응
- [ ] 주요 UI에 플랫폼별 조건부 렌더링 구현
- [ ] AlertDialog, ActionSheet 플랫폼별 분기
- [ ] 입력 위젯에 `.adaptive()` 생성자 사용
- [ ] iOS 네비게이션에 `CupertinoPageRoute` 사용

#### 다크 모드
- [ ] 시맨틱 컬러 사용 (하드코딩 금지)
- [ ] `CupertinoThemeData` 라이트/다크 테마 설정
- [ ] 모든 화면에서 다크 모드 테스트

#### 레이아웃
- [ ] `SafeArea` 위젯으로 노치/홈 인디케이터 대응
- [ ] 최소 터치 타겟 44x44pt 확보
- [ ] 8pt 그리드 시스템 적용
- [ ] 화면 크기 하드코딩 제거

#### 성능
- [ ] const 생성자 전체 적용
- [ ] 이미지 최적화 및 캐싱 구현
- [ ] `ListView.builder` 지연 로딩 사용
- [ ] 불필요한 `setState()` 제거

#### 테스트
- [ ] 실제 iOS 기기에서 테스트
- [ ] 라이트/다크 모드 모두 테스트
- [ ] 다양한 화면 크기 테스트 (SE ~ Pro Max)

### 중간 우선순위 (권장)

#### 애니메이션
- [ ] 주요 전환에 Hero 애니메이션 추가
- [ ] iOS 애니메이션 곡선 사용 (`Curves.easeOut`)
- [ ] 페이지 전환 커스터마이징

#### 상호작용
- [ ] 스와이프 제스처 지원
- [ ] Pull-to-refresh 구현 (해당 화면)
- [ ] 컨텍스트 메뉴 추가 (롱 프레스)

#### 접근성
- [ ] 시맨틱 라벨 추가
- [ ] VoiceOver 테스트
- [ ] 색상 대비 4.5:1 이상 확보
- [ ] Dynamic Type 지원

#### 코드 품질
- [ ] 상태 관리 라이브러리 도입
- [ ] 위젯을 작은 컴포넌트로 분할
- [ ] 린터 규칙 활성화

### 낮은 우선순위 (세련미)

#### 고급 기능
- [ ] 햅틱 피드백 추가
- [ ] 사용자 정의 페이지 전환
- [ ] iOS 특정 제스처 구현
- [ ] 애니메이션 곡선 미세 조정

#### 최적화
- [ ] `RepaintBoundary` 적용
- [ ] 이미지 해상도 최적화
- [ ] 번들 크기 최소화
- [ ] 지연 로딩 확대

---

## 유용한 패키지

### 필수 패키지

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6  # iOS 스타일 아이콘
```

### 권장 패키지

```yaml
dependencies:
  # 플랫폼 적응
  flutter_platform_widgets: ^6.0.0
  
  # 다크 모드 관리
  adaptive_theme: ^3.6.0
  
  # 이미지 캐싱
  cached_network_image: ^3.3.0
  
  # 상태 관리
  provider: ^6.1.0
  # 또는
  riverpod: ^2.4.0
  # 또는
  bloc: ^8.1.2
  
dev_dependencies:
  # 아이콘 생성
  flutter_launcher_icons: ^0.13.0
  
  # 스플래시 스크린
  flutter_native_splash: ^2.3.0
  
  # 이미지 압축
  flutter_image_compress: ^2.1.0
```

---

## 빠른 참조 (Quick Reference)

### 자주 사용하는 위젯

```dart
// 기본 구조
CupertinoApp()
CupertinoPageScaffold()
CupertinoNavigationBar()
CupertinoTabScaffold()
CupertinoTabBar()

// 버튼 & 입력
CupertinoButton()
CupertinoButton.filled()
CupertinoTextField()
CupertinoSwitch()
CupertinoSegmentedControl()

// 선택기
CupertinoDatePicker()
CupertinoPicker()

// 다이얼로그 & 모달
CupertinoAlertDialog()
CupertinoActionSheet()
CupertinoContextMenu()
showCupertinoModalPopup()

// 리스트
CupertinoListSection()
CupertinoListTile()
CupertinoSliverRefreshControl()

// 기타
CupertinoActivityIndicator()
CupertinoSearchTextField()
```

### 주요 색상

```dart
// 라벨
CupertinoColors.label
CupertinoColors.secondaryLabel
CupertinoColors.tertiaryLabel

// 배경
CupertinoColors.systemBackground
CupertinoColors.secondarySystemBackground

// Fill
CupertinoColors.systemFill
CupertinoColors.tertiarySystemFill

// 시스템 컬러
CupertinoColors.systemBlue
CupertinoColors.systemGreen
CupertinoColors.systemRed
```

### 주요 측정치

```dart
// 간격
const double spacing2 = 16.0;
const double spacing3 = 24.0;
const double spacing5 = 44.0;

// 터치 타겟
const double minTouchTarget = 44.0;

// 바 높이
const double navigationBarHeight = 44.0;
const double tabBarHeight = 49.0;

// 모서리 반경
const double cornerRadius = 8.0;

// 불투명도
const double pressedOpacity = 0.4;
```

---

## 참고 자료

### 공식 문서

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Flutter Cupertino 위젯 문서](https://api.flutter.dev/flutter/cupertino/cupertino-library.html)
- [Flutter 플랫폼 적응 가이드](https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations)

### 디자인 도구

- [Figma iOS UI Kit](https://www.figma.com/community/file/858143367356468985)
- [Apple SF Symbols](https://developer.apple.com/sf-symbols/)
- [iOS 디자인 템플릿](https://www.learnui.design/blog/ios-design-guidelines-templates.html)

---

## 마치며

이 가이드는 Flutter로 iOS 스타일 앱을 개발하기 위한 포괄적인 참조 자료입니다.

### 핵심 원칙
1. **Clarity, Deference, Depth** - Apple의 3대 디자인 원칙 준수
2. **시맨틱 컬러** - 하드코딩 대신 시스템 컬러 사용
3. **8pt 그리드** - 일관된 간격과 레이아웃
4. **44pt 터치 타겟** - 접근성 확보

### 필수 체크리스트
- SafeArea로 노치/홈 인디케이터 대응
- 다크 모드 완전 지원
- const 생성자 사용
- 플랫폼별 조건부 렌더링
- 실제 기기 테스트

### 권장 도구
- **flutter_platform_widgets** - 플랫폼 적응
- **cached_network_image** - 이미지 최적화
- **adaptive_theme** - 다크 모드 관리
- **provider/riverpod** - 상태 관리

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025년 1월  
**Flutter 버전**: 3.x  
**iOS 대상**: iOS 13+