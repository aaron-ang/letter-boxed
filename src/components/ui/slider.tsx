import { Slider as SliderPrimitive } from "radix-ui";
import type * as React from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1 data-vertical:h-full data-horizontal:w-full data-vertical:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute select-none bg-primary data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {_values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          // biome-ignore lint/suspicious/noArrayIndexKey: thumb count is slider-controlled and stable
          key={index}
          className="relative block size-3 shrink-0 select-none rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-3 focus-visible:outline-hidden focus-visible:ring-3 active:ring-3 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
