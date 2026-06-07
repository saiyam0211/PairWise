import { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  ViewStyle,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { ArrowRight, ArrowLeft } from '@/components/ArrowIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterScreen, exitScreen, type ScreenDirection } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';
import { BrandDecor } from '@/components/BrandDecor';

interface OnboardScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Vertically center the whole step — use on welcome only. */
  center?: boolean;
  card?: boolean;
  scroll?: boolean;
  screenKey: string;
  direction?: ScreenDirection;
}

function OnboardCard({ children }: { children: ReactNode }) {
  const { palette, isDark } = useTheme();

  return (
    <View
      className="w-full p-5"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.xxl,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('md', isDark),
      }}
    >
      {children}
    </View>
  );
}

export function OnboardScreen({
  title,
  subtitle,
  children,
  footer,
  center = false,
  card = false,
  scroll = false,
  screenKey,
  direction = 'forward',
}: OnboardScreenProps) {
  const { palette } = useTheme();
  const reduced = useReducedMotion();

  const header = (
    <View className="w-full mb-6" style={{ alignItems: center ? 'center' : 'flex-start' }}>
      <View style={{ alignSelf: center ? 'center' : 'flex-start' }}>
        <BrandDecor size={center ? 'md' : 'sm'} />
      </View>
      <Text
        className="font-manrope-extrabold mb-2 w-full"
        style={{
          fontSize: 30,
          color: palette.onSurface,
          letterSpacing: -0.5,
          textAlign: center ? 'center' : 'left',
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="font-manrope-medium text-base w-full"
          style={{
            color: palette.onSurfaceVariant,
            lineHeight: 24,
            textAlign: center ? 'center' : 'left',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const body = (
    <View className="w-full">{card ? <OnboardCard>{children}</OnboardCard> : children}</View>
  );

  const main = (
    <View className="w-full max-w-[400px] self-center">
      {header}
      {body}
    </View>
  );

  const pad = { paddingHorizontal: 24, paddingBottom: 24 } as const;
  const scrollContentStyle = center
    ? { flexGrow: 1, justifyContent: 'center' as const, ...pad, paddingTop: 32 }
    : { flexGrow: 1, ...pad, paddingTop: 40 };

  const topContentStyle = center
    ? { flex: 1, justifyContent: 'center' as const, ...pad, paddingTop: 32 }
    : { flex: 1, ...pad, paddingTop: 40 };

  const stepContent = (
    <>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {main}
        </ScrollView>
      ) : (
        <View style={topContentStyle}>{main}</View>
      )}
      {footer ? (
        <View className="px-6 pb-4 pt-2">
          <View className="w-full max-w-[400px] self-center">{footer}</View>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Animated.View
          key={screenKey}
          entering={enterScreen(reduced, direction)}
          exiting={exitScreen(reduced, direction)}
          style={{ flex: 1 }}
        >
          {stepContent}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'sage' | 'peach';
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'sage',
  trailingArrow,
}: PrimaryButtonProps & { trailingArrow?: boolean }) {
  const { palette, isDark } = useTheme();
  const off = disabled || loading;
  const bg = off ? palette.keyBgDark : variant === 'peach' ? palette.secondary : palette.accent;
  const textColor = off ? palette.onSurfaceVariant : palette.onAccent;
  const displayLabel = label.replace(/\s*→\s*$/, '').trim();

  return (
    <MotionPressable
      onPress={onPress}
      disabled={off}
      className="py-4 items-center w-full"
      style={{
        backgroundColor: bg,
        borderRadius: RADIUS.pill,
        ...(!off ? softShadow('md', isDark) : {}),
      }}
    >
      {loading ? (
        <Text className="font-manrope-bold text-base" style={{ color: textColor }}>
          Please wait…
        </Text>
      ) : trailingArrow ? (
        <View className="flex-row items-center gap-2">
          <Text className="font-manrope-bold text-base" style={{ color: textColor }}>
            {displayLabel}
          </Text>
          <ArrowRight size={20} color={textColor} />
        </View>
      ) : (
        <Text className="font-manrope-bold text-base" style={{ color: textColor }}>
          {displayLabel}
        </Text>
      )}
    </MotionPressable>
  );
}

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ label, onPress, trailingArrow }: SecondaryButtonProps & { trailingArrow?: boolean }) {
  const { palette } = useTheme();
  const displayLabel = label.replace(/\s*→\s*$/, '').trim();

  return (
    <MotionPressable onPress={onPress} className="items-center py-3 w-full">
      {trailingArrow ? (
        <View className="flex-row items-center gap-2">
          <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
            {displayLabel}
          </Text>
          <ArrowRight size={18} color={palette.dateHeader} />
        </View>
      ) : (
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
          {displayLabel}
        </Text>
      )}
    </MotionPressable>
  );
}

export function M3InputStyle(palette: ReturnType<typeof useTheme>['palette'], isDark = false): ViewStyle {
  return {
    backgroundColor: palette.cream,
    color: palette.onSurface,
    borderRadius: RADIUS.lg,
    fontSize: 18,
    borderWidth: 1,
    borderColor: palette.border,
    ...softShadow('sm', isDark),
  };
}

interface OnboardTextInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  autoComplete?: TextInput['props']['autoComplete'];
  loading?: boolean;
  canSubmit?: boolean;
}

export function OnboardTextInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  autoFocus,
  keyboardType,
  autoCapitalize,
  autoComplete,
  loading = false,
  canSubmit: canSubmitProp,
}: OnboardTextInputProps) {
  const { palette, isDark } = useTheme();
  const hasValue = canSubmitProp ?? value.trim().length > 0;
  const showArrow = hasValue || loading;
  const canPress = hasValue && !loading;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.cream,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: palette.border,
        paddingRight: 8,
        paddingLeft: 4,
        ...softShadow('sm', isDark),
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.onSurfaceVariant}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={!loading}
        returnKeyType="done"
        onSubmitEditing={() => canPress && onSubmit()}
        className="font-manrope flex-1 px-4 py-4"
        style={{ fontSize: 18, color: palette.onSurface }}
      />
      {showArrow ? (
        <MotionPressable
          onPress={onSubmit}
          disabled={!canPress}
          accessibilityLabel={loading ? 'Sending code' : 'Continue'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canPress || loading ? 1 : 0.5,
            ...softShadow('sm', isDark),
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.onAccent} />
          ) : (
            <ArrowRight size={20} color={palette.onAccent} />
          )}
        </MotionPressable>
      ) : null}
    </View>
  );
}

/** Back link styled for inside form cards. */
export function OnboardBackButton({ label = 'Back', onPress }: { label?: string; onPress: () => void }) {
  const { palette } = useTheme();

  return (
    <MotionPressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 w-full"
      style={{ marginTop: 20, paddingVertical: 12 }}
    >
      <ArrowLeft size={20} color={palette.dateHeader} />
      <Text
        className="font-manrope-semibold text-sm"
        style={{ color: palette.dateHeader, lineHeight: 20 }}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}
