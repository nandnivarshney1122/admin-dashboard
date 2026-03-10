import { Input } from "@/components/ui/input";

const SubjectSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Subject"
    />
  );
};

export default SubjectSelect;
