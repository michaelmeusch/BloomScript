import React, { forwardRef } from "react";
import { ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps & {
  children?: React.ReactNode;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  bottomOffset?: number;
  disableScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
  extraKeyboardSpace?: number;
  ScrollViewComponent?: React.ComponentType<any>;
};

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
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </ScrollView>
  );
});
