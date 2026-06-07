import { useRef } from 'react';
import { View, Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import { CheckIcon, type CheckIconHandle } from '@/components/icons/CheckIcon';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { MotionPressable } from '@/components/MotionPressable';

interface NumericKeypadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  hideDecimal?: boolean;
}

const DIGIT_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

const KEY_H = 62;
const GAP = 10;
const SIDE_W = 62;
const CONFIRM_H = KEY_H * 3 + GAP * 2;

export function NumericKeypad({
  onDigit,
  onBackspace,
  onConfirm,
  confirmDisabled = false,
  hideDecimal = false,
}: NumericKeypadProps) {
  const { palette, isDark } = useTheme();
  const checkRef = useRef<CheckIconHandle>(null);

  const keyStyle = (bg: string, height = KEY_H, elevated = true) => ({
    height,
    borderRadius: RADIUS.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: palette.border,
    ...(elevated ? softShadow('sm', isDark) : {}),
  });

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 }}>
      {/* <Text
        className="font-manrope-semibold text-xs uppercase tracking-widest text-center mb-3"
        style={{ color: palette.onSurfaceVariant }}
      >
        Keypad
      </Text> */}

      <View style={{ flexDirection: 'row', gap: GAP }}>
        <View style={{ flex: 1, gap: GAP }}>
          {DIGIT_ROWS.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: GAP }}>
              {row.map((key) => (
                <MotionPressable
                  key={key}
                  onPress={() => onDigit(key)}
                  style={{ ...keyStyle(palette.surface), flex: 1 }}
                  scaleTo={0.94}
                >
                  <Text className="font-manrope-semibold" style={{ fontSize: 26, color: palette.onSurface }}>
                    {key}
                  </Text>
                </MotionPressable>
              ))}
            </View>
          ))}

          {hideDecimal ? (
            <MotionPressable onPress={() => onDigit('0')} style={keyStyle(palette.cream)} scaleTo={0.94}>
              <Text className="font-manrope-semibold" style={{ fontSize: 26, color: palette.onSurface }}>
                0
              </Text>
            </MotionPressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: GAP }}>
              <MotionPressable onPress={() => onDigit('0')} style={{ ...keyStyle(palette.cream), flex: 2 }} scaleTo={0.94}>
                <Text className="font-manrope-semibold" style={{ fontSize: 26, color: palette.onSurface }}>
                  0
                </Text>
              </MotionPressable>
              <MotionPressable onPress={() => onDigit('.')} style={{ ...keyStyle(palette.surface), flex: 1 }} scaleTo={0.94}>
                <Text className="font-manrope-semibold" style={{ fontSize: 26, color: palette.onSurface }}>
                  .
                </Text>
              </MotionPressable>
            </View>
          )}
        </View>

        <View style={{ width: SIDE_W, gap: GAP }}>
          <MotionPressable onPress={onBackspace} style={keyStyle(palette.keyBgDark, KEY_H, false)} scaleTo={0.94}>
            <Delete size={22} color={palette.onSurface} />
          </MotionPressable>
          <MotionPressable
            onPress={() => {
              if (!confirmDisabled) checkRef.current?.startAnimation();
              onConfirm();
            }}
            disabled={confirmDisabled}
            style={keyStyle(
              confirmDisabled ? palette.keyBgDark : palette.accent,
              CONFIRM_H,
              !confirmDisabled,
            )}
            scaleTo={confirmDisabled ? 1 : 0.96}
          >
            <CheckIcon
              ref={checkRef}
              size={32}
              duration={1}
              color={confirmDisabled ? palette.onSurfaceVariant : palette.onAccent}
              isAnimated={!confirmDisabled}
            />
          </MotionPressable>
        </View>
      </View>
    </View>
  );
}
