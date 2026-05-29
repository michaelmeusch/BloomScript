import React, { forwardRef } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import { ScrollView, ScrollViewProps } from "react-native";

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

export const KeyboardAwareScrollViewCompat = forwardRef<
  ScrollView,
  Props
>(function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  bottomOffset,
  disableScrollOnKeyboardHide,
  enabled,
  extraKeyboardSpace,
  ScrollViewComponent,
  ...props
}, ref) {
  return (
    <KeyboardAwareScrollView
      ref={ref as any}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bottomOffset={bottomOffset}
      disableScrollOnKeyboardHide={disableScrollOnKeyboardHide}
      enabled={enabled}
      extraKeyboardSpace={extraKeyboardSpace}
      ScrollViewComponent={ScrollViewComponent}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
});
