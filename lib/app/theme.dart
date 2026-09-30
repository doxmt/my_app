import 'package:flutter/material.dart';

/// 웹(`webapp/app/globals.css`)과 같은 토큰. 라이트는 흰 배경 + 블루 강조색.
const _lightScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xFF2563EB),
  onPrimary: Color(0xFFFFFFFF),
  primaryContainer: Color(0xFFEAF1FF),
  onPrimaryContainer: Color(0xFF1E40AF),
  secondary: Color(0xFF475569),
  onSecondary: Color(0xFFFFFFFF),
  secondaryContainer: Color(0xFFF1F5F9),
  onSecondaryContainer: Color(0xFF1E293B),
  tertiary: Color(0xFF15803D),
  onTertiary: Color(0xFFFFFFFF),
  tertiaryContainer: Color(0xFFDCFCE7),
  onTertiaryContainer: Color(0xFF14532D),
  error: Color(0xFFDC2626),
  onError: Color(0xFFFFFFFF),
  errorContainer: Color(0xFFFEE2E2),
  onErrorContainer: Color(0xFF7F1D1D),
  surface: Color(0xFFFFFFFF),
  onSurface: Color(0xFF111827),
  onSurfaceVariant: Color(0xFF4B5563),
  outline: Color(0xFFD1D5DB),
  outlineVariant: Color(0xFFE5E7EB),
  surfaceTint: Colors.transparent,
  surfaceContainerLowest: Color(0xFFFFFFFF),
  surfaceContainerLow: Color(0xFFF9FAFB),
  surfaceContainer: Color(0xFFF5F7FA),
  surfaceContainerHigh: Color(0xFFF1F5F9),
  surfaceContainerHighest: Color(0xFFE5E7EB),
  inverseSurface: Color(0xFF111827),
  onInverseSurface: Color(0xFFF9FAFB),
  inversePrimary: Color(0xFF6C9BFF),
);

const _darkScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xFF6C9BFF),
  onPrimary: Color(0xFF06122E),
  primaryContainer: Color(0xFF172A52),
  onPrimaryContainer: Color(0xFFB9D0FF),
  secondary: Color(0xFF9AA6BA),
  onSecondary: Color(0xFF0B1220),
  secondaryContainer: Color(0xFF1A2438),
  onSecondaryContainer: Color(0xFFE5E9F0),
  tertiary: Color(0xFF4ADE80),
  onTertiary: Color(0xFF04210F),
  tertiaryContainer: Color(0xFF14532D),
  onTertiaryContainer: Color(0xFFDCFCE7),
  error: Color(0xFFF87171),
  onError: Color(0xFF450A0A),
  errorContainer: Color(0xFF7F1D1D),
  onErrorContainer: Color(0xFFFEE2E2),
  surface: Color(0xFF0B1220),
  onSurface: Color(0xFFE5E9F0),
  onSurfaceVariant: Color(0xFF9AA6BA),
  outline: Color(0xFF34425F),
  outlineVariant: Color(0xFF25314A),
  surfaceTint: Colors.transparent,
  surfaceContainerLowest: Color(0xFF080D18),
  surfaceContainerLow: Color(0xFF0E1728),
  surfaceContainer: Color(0xFF111A2B),
  surfaceContainerHigh: Color(0xFF151F33),
  surfaceContainerHighest: Color(0xFF1A2438),
  inverseSurface: Color(0xFFE5E9F0),
  onInverseSurface: Color(0xFF111827),
  inversePrimary: Color(0xFF2563EB),
);

/// 웹의 `--radius: 0.5rem`.
const _radius = 8.0;

ThemeData buildLightTheme() => _buildTheme(_lightScheme);

ThemeData buildDarkTheme() => _buildTheme(_darkScheme);

ThemeData _buildTheme(ColorScheme scheme) {
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius));
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surface,
      foregroundColor: scheme.onSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      color: scheme.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(_radius),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    dividerTheme: DividerThemeData(color: scheme.outlineVariant, space: 1, thickness: 1),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: scheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: scheme.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(shape: shape)),
    elevatedButtonTheme: ElevatedButtonThemeData(style: ElevatedButton.styleFrom(shape: shape)),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(shape: shape, side: BorderSide(color: scheme.outline)),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(shape: shape)),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: scheme.primaryContainer,
      elevation: 0,
    ),
    chipTheme: ChipThemeData(shape: shape, side: BorderSide(color: scheme.outlineVariant)),
    snackBarTheme: SnackBarThemeData(shape: shape, behavior: SnackBarBehavior.floating),
  );
}
