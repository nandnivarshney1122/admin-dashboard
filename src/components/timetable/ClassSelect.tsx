import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_CLASSES = ["10-A", "10-B", "9-A", "9-B", "8-A", "8-B"];

const ClassSelect = ({
  value,
  onChange,
  options = DEFAULT_CLASSES,
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select class" />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ClassSelect;
