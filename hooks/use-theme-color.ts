import { Colors } from '@/utils/colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName: string
) {
  return props.dark ?? Colors.text;
}
