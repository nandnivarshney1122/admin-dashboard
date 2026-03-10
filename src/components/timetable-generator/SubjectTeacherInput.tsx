import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import TeacherSelect from "@/components/timetable/TeacherSelect";
import SubjectSelect from "@/components/timetable/SubjectSelect";
import { Input } from "@/components/ui/input";

export type SubjectTeacherRow = {
  name: string;
  teacherId: string;
  weeklyHours: number;
  room: string;
};

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const SubjectTeacherInput = ({
  value,
  onChange,
  onRemove,
  teachers,
  subjectOptions,
  disabled,
}: {
  value: SubjectTeacherRow;
  onChange: (next: SubjectTeacherRow) => void;
  onRemove: () => void;
  teachers: Teacher[];
  subjectOptions: string[];
  disabled: boolean;
}) => {
  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Subject</Label>
          <SubjectSelect
            value={value.name}
            onChange={(v) => onChange({ ...value, name: v })}
            options={subjectOptions}
          />
        </div>

        <div className="space-y-2">
          <Label>Teacher</Label>
          <TeacherSelect
            value={value.teacherId}
            onChange={(v) => onChange({ ...value, teacherId: v })}
            teachers={teachers}
          />
        </div>

        <div className="space-y-2">
          <Label>Weekly Hours</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={String(value.weeklyHours)}
            onChange={(e) => onChange({ ...value, weeklyHours: Number(e.target.value || 0) })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Room (optional)</Label>
          <Input
            value={value.room}
            onChange={(e) => onChange({ ...value, room: e.target.value })}
            placeholder="Room 101"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onRemove} disabled={disabled}>
          Remove
        </Button>
      </div>
    </div>
  );
};

export default SubjectTeacherInput;
