import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const steps = prevProcess.length;
  const disabled = !steps || solving;
  const pct = steps ? Math.round(((currentStep + 1) / steps) * 100) : 0;
  const sliderValue = [Math.min(currentStep, Math.max(steps - 1, 0))];

  return (
    <>
      <div className="mt-2 mb-2 flex w-3/5 items-center gap-1">
        <Slider
          min={0}
          max={Math.max(steps - 1, 1)}
          value={sliderValue}
          onValueCommit={(v) => {
            const n = v[0];
            if (n !== currentStep && steps > 1) gotoStep(n);
          }}
          disabled={disabled}
          className="flex-1"
        />

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

        <span className="min-w-22.5 text-right text-sm">
          {steps ? `${currentStep + 1} / ${steps} (${pct}%)` : "— / —"}
        </span>
      </div>

      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="visualize-checkbox"
            checked={visualize}
            onCheckedChange={(c) => setVisualize(Boolean(c))}
            disabled={solving}
          />
          <Label htmlFor="visualize-checkbox">Visualize</Label>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="delay-select" className="text-xs">
            Delay(ms)
          </Label>
          <Select
            value={delay.toString()}
            onValueChange={(v) => setDelay(Number.parseInt(v, 10))}
            disabled={!visualize || solving}
          >
            <SelectTrigger id="delay-select" className="w-24">
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
    </>
  );
};

export default VisualizationControls;
