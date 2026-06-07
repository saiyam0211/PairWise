import { useState } from 'react';
import { Modal, View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Check, FileSpreadsheet, Plus, Sheet } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';
import {
  createPairwiseSpreadsheet,
  formatSpreadsheetDate,
  setGoogleSpreadsheet,
  type GoogleSpreadsheetFile,
} from '@/lib/googleSheets';

interface GoogleSheetsPickerProps {
  visible: boolean;
  files: GoogleSpreadsheetFile[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onConnected: () => void;
  onSavingChange: (saving: boolean) => void;
}

export function GoogleSheetsPicker({
  visible,
  files,
  loading,
  saving,
  onClose,
  onConnected,
  onSavingChange,
}: GoogleSheetsPickerProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  async function selectExisting(file: GoogleSpreadsheetFile) {
    onSavingChange(true);
    try {
      await setGoogleSpreadsheet(file.id, file.name);
      onConnected();
    } catch (error) {
      Alert.alert('Could not connect', error instanceof Error ? error.message : 'Try again.');
    } finally {
      onSavingChange(false);
    }
  }

  async function createNew() {
    onSavingChange(true);
    try {
      await createPairwiseSpreadsheet();
      onConnected();
    } catch (error) {
      Alert.alert('Could not create spreadsheet', error instanceof Error ? error.message : 'Try again.');
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={enterFade(reduced)}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(61, 64, 57, 0.52)' }}
      >
        <MotionPressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          scaleTo={1}
        />

        <Animated.View
          entering={enterFadeDown(reduced, 20)}
          className="px-5 pt-5 pb-8"
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: RADIUS.xxl,
            borderTopRightRadius: RADIUS.xxl,
            maxHeight: '88%',
            ...softShadow('lg', isDark),
          }}
        >
          <View className="flex-row items-center gap-3 mb-1 px-1">
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: palette.sage + '55' }}
            >
              <Sheet size={22} color={palette.onSurface} />
            </View>
            <View className="flex-1">
              <Text className="font-manrope-extrabold text-lg" style={{ color: palette.onSurface }}>
                Choose a spreadsheet
              </Text>
              <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
                Pick one from your Google account, or let PairWise create one for you
              </Text>
            </View>
          </View>

          <MotionPressable
            onPress={createNew}
            disabled={saving || loading}
            className="mt-5 mb-4 p-4 flex-row items-center gap-3"
            style={{
              backgroundColor: palette.cream,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: palette.border,
              opacity: saving || loading ? 0.7 : 1,
              ...softShadow('sm', isDark),
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: palette.accent }}
            >
              {saving ? (
                <ActivityIndicator color={palette.onAccent} />
              ) : (
                <Plus size={22} color={palette.onAccent} />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
                Create new spreadsheet
              </Text>
              <Text className="font-manrope-medium text-xs mt-0.5" style={{ color: palette.onSurfaceVariant }}>
                PairWise — Shared Spending, with your current cycle tab ready
              </Text>
            </View>
          </MotionPressable>

          <Text
            className="font-manrope-semibold text-xs uppercase tracking-widest px-1 mb-3"
            style={{ color: palette.onSurfaceVariant }}
          >
            Your spreadsheets
          </Text>

          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color={palette.primary} />
              <Text className="font-manrope-medium text-sm mt-3" style={{ color: palette.onSurfaceVariant }}>
                Loading your sheets…
              </Text>
            </View>
          ) : files.length === 0 ? (
            <View
              className="py-8 px-4 items-center mb-3"
              style={{ backgroundColor: palette.cream, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: palette.border }}
            >
              <Text className="font-manrope-medium text-sm text-center" style={{ color: palette.onSurfaceVariant }}>
                No spreadsheets found. Create a new one above to get started.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View className="gap-2 mb-3">
                {files.map((file) => (
                  <SheetRow key={file.id} file={file} disabled={saving} onPress={() => selectExisting(file)} />
                ))}
              </View>
            </ScrollView>
          )}

          <MotionPressable
            onPress={onClose}
            disabled={saving}
            className="py-4 items-center mt-2"
            style={{
              backgroundColor: palette.cream,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: palette.border,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
              Cancel
            </Text>
          </MotionPressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function SheetRow({
  file,
  disabled,
  onPress,
}: {
  file: GoogleSpreadsheetFile;
  disabled: boolean;
  onPress: () => void;
}) {
  const { palette, isDark } = useTheme();

  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-3 p-4"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: palette.border,
        opacity: disabled ? 0.7 : 1,
        ...softShadow('sm', isDark),
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: palette.peach + '55' }}
      >
        <FileSpreadsheet size={18} color={palette.onSurface} />
      </View>
      <View className="flex-1">
        <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }} numberOfLines={1}>
          {file.name}
        </Text>
        {file.modifiedTime ? (
          <Text className="font-manrope-medium text-xs mt-0.5" style={{ color: palette.onSurfaceVariant }}>
            Updated {formatSpreadsheetDate(file.modifiedTime)}
          </Text>
        ) : null}
      </View>
      <Check size={18} color={palette.primary} style={{ opacity: 0.85 }} />
    </MotionPressable>
  );
}
