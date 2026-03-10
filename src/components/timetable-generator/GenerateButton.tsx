import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const GenerateButton = ({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <Button type="button" onClick={onClick} disabled={disabled || loading} className="w-full sm:w-auto">
      <Sparkles className="h-4 w-4 mr-2" />
      {loading ? "Generating..." : "Generate Timetable"}
    </Button>
  );
};

export default GenerateButton;
