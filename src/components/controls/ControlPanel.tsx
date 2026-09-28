import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";

type ControlPanelProps = {
  fieldsMatch: boolean;
  resetFields: () => void;
  handleSolve: () => void;
  findBest: () => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  fieldsMatch,
  resetFields,
  handleSolve,
  findBest,
}) => {
  const solving = useGameStore((s) => s.solving);
  const solution = useGameStore((s) => s.solution);
  const isSuccess = useGameStore((s) => s.isSuccess);
  const visualize = useGameStore((s) => s.visualize);

  const showFindBest = solution.length > 0 && isSuccess && !visualize && fieldsMatch;

  return (
    <div className="flex flex-row gap-6">
      <Button variant="outline" onClick={resetFields} className="h-10 rounded-full bg-card px-5">
        Reset
      </Button>
      {showFindBest ? (
        <Button disabled={solving} onClick={findBest} className="h-10 rounded-full px-5">
          {solving && <LoaderCircle className="animate-spin" />}
          Find Best
        </Button>
      ) : (
        <Button disabled={solving} onClick={handleSolve} className="h-10 rounded-full px-5">
          {solving && <LoaderCircle className="animate-spin" />}
          Solve
        </Button>
      )}
    </div>
  );
};

export default ControlPanel;
