"use client";

import { useCallback, useState } from "react";
import type { FocusEventHandler } from "react";

export function usePlaceholderFocus(
  placeholder?: string,
  onFocus?: FocusEventHandler<HTMLInputElement>,
  onBlur?: FocusEventHandler<HTMLInputElement>,
) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback<FocusEventHandler<HTMLInputElement>>(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  return {
    placeholder: focused ? "" : placeholder,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
