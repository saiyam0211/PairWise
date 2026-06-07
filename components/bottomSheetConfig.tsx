import { useCallback, useMemo } from 'react';
import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '@/lib/theme';
import { RADIUS } from '@/lib/brand';
import { SHEET_MOTION } from '@/lib/motion';

export function useAppBottomSheet() {
  const { palette } = useTheme();

  const backdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: palette.surface,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
    }),
    [palette.surface],
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: palette.sage, width: 48, height: 5, borderRadius: 3 }),
    [palette.sage],
  );

  return { backdropComponent, backgroundStyle, handleIndicatorStyle, animationConfigs: SHEET_MOTION };
}
