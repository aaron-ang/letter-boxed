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
    <div className="mt-6 mb-2 flex flex-row gap-3">
      <Button onClick={resetFields} className="h-10 bg-red-600 px-5 text-white hover:bg-red-700">
        Reset
      </Button>
      {showFindBest ? (
        <Button disabled={solving} onClick={findBest} className="h-10 px-5">
          {solving && <LoaderCircle className="animate-spin" />}
          Find Best
        </Button>
      ) : (
        <Button disabled={solving} onClick={handleSolve} className="h-10 px-5">
          {solving && <LoaderCircle className="animate-spin" />}
          Solve
        </Button>
      )}
    </div>
  );
};

export default ControlPanel;
