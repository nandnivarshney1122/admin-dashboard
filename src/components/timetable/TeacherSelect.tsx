import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function teacherLabel(t: Teacher) {
  const name = `${t.firstName || ""} ${t.lastName || ""}`.trim();
  if (name) return name;
  return t.email || t._id;
}

const TeacherSelect = ({
  value,
  onChange,
  teachers,
}: {
  value: string;
  onChange: (v: string) => void;
  teachers: Teacher[];
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select teacher" />
      </SelectTrigger>
      <SelectContent>
        {teachers.map((t) => (
          <SelectItem key={t._id} value={t._id}>
            {teacherLabel(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TeacherSelect;
