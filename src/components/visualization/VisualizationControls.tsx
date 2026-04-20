import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useGameStore } from "@/store/gameStore";

const VisualizationControls: React.FC = () => {
  const visualize = useGameStore((s) => s.visualize);
  const delay = useGameStore((s) => s.delay);
  const prevProcess = useGameStore((s) => s.prevProcess);
  const solving = useGameStore((s) => s.solving);
  const currentStep = useGameStore((s) => s.currentStep);
  const setVisualize = useGameStore((s) => s.setVisualize);
  const setDelay = useGameStore((s) => s.setDelay);
  const gotoStep = useGameStore((s) => s.gotoStep);

  const [pending, setPending] = useState<number | null>(null);

  const steps = prevProcess.length;
  const disabled = !steps || solving;
  const pct = steps ? Math.round(((currentStep + 1) / steps) * 100) : 0;
  const displayed = pending ?? currentStep;
  const sliderValue = [Math.min(displayed, Math.max(steps - 1, 0))];

  return (
    <div className="mt-4 flex w-full max-w-lg flex-col items-center gap-6">
      <div className="flex flex-row items-center gap-8">
        <div className="flex items-center gap-2">
          <Checkbox
            id="visualize-checkbox"
            checked={visualize}
            onCheckedChange={(c) => setVisualize(Boolean(c))}
            disabled={solving}
            className="size-5"
          />
          <Label htmlFor="visualize-checkbox" className="cursor-pointer">
            Visualize
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="delay-select">Delay (ms)</Label>
          <Select
            value={delay.toString()}
            onValueChange={(v) => setDelay(Number.parseInt(v, 10))}
            disabled={!visualize || solving}
          >
            <SelectTrigger id="delay-select" className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 50, 100].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Slider
        min={0}
        max={Math.max(steps - 1, 1)}
        value={sliderValue}
        onValueChange={(v) => setPending(v[0])}
        onValueCommit={(v) => {
          const n = v[0];
          setPending(null);
          if (n !== currentStep && steps > 1) gotoStep(n);
        }}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex flex-row items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || currentStep <= 0}
          onClick={() => gotoStep(currentStep - 1)}
          aria-label="previous step"
        >
          <ChevronLeft />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || currentStep >= steps - 1}
          onClick={() => gotoStep(currentStep + 1)}
          aria-label="next step"
        >
          <ChevronRight />
        </Button>

        <span className="min-w-28 text-sm tabular-nums">
          {steps ? `${currentStep + 1} / ${steps} (${pct}%)` : "— / —"}
        </span>
      </div>
    </div>
  );
};

export default VisualizationControls;
