import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import ClassSelect from "@/components/timetable/ClassSelect";
import SubjectTeacherInput, { type SubjectTeacherRow } from "@/components/timetable-generator/SubjectTeacherInput";
import GenerateButton from "@/components/timetable-generator/GenerateButton";

export type GeneratorFormValue = {
  classId: string;
  days: ("MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY")[];
  periodsPerDay: number;
  subjects: SubjectTeacherRow[];
};

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const ALL_DAYS: GeneratorFormValue["days"] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function dayLabel(d: string) {
  return d.slice(0, 1) + d.slice(1).toLowerCase();
}

const TimetableGeneratorForm = ({
  initialValue,
  classOptions,
  subjectOptions,
  teachers,
  loadingTeachers,
  generating,
  onGenerate,
}: {
  initialValue: GeneratorFormValue;
  classOptions: string[];
  subjectOptions: string[];
  teachers: Teacher[];
  loadingTeachers: boolean;
  generating: boolean;
  onGenerate: (value: GeneratorFormValue) => Promise<void>;
}) => {
  const [value, setValue] = useState<GeneratorFormValue>(initialValue);

  const daysValid = value.days.length > 0;
  const periodsValid = Number.isFinite(value.periodsPerDay) && value.periodsPerDay >= 1 && value.periodsPerDay <= 20;

  const hoursSum = useMemo(
    () => value.subjects.reduce((a, s) => a + (Number(s.weeklyHours) || 0), 0),
    [value.subjects]
  );

  const slotCapacity = value.days.length * (Number(value.periodsPerDay) || 0);

  const canGenerate =
    value.classId.trim() &&
    daysValid &&
    periodsValid &&
    value.subjects.length > 0 &&
    value.subjects.every((s) => s.name.trim() && s.teacherId.trim() && Number(s.weeklyHours) > 0) &&
    hoursSum <= slotCapacity;

  function toggleDay(day: GeneratorFormValue["days"][number]) {
    setValue((prev) => {
      const has = prev.days.includes(day);
      return {
        ...prev,
        days: has ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      };
    });
  }

  function addSubject() {
    setValue((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { name: "", teacherId: "", weeklyHours: 1, room: "" }],
    }));
  }

  function updateSubject(idx: number, next: SubjectTeacherRow) {
    setValue((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => (i === idx ? next : s)),
    }));
  }

  function removeSubject(idx: number) {
    setValue((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== idx),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Class</Label>
          <ClassSelect
            value={value.classId}
            onChange={(v) => setValue((p) => ({ ...p, classId: v }))}
            options={classOptions}
          />
        </div>

        <div className="space-y-2">
          <Label>Periods per day</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={String(value.periodsPerDay)}
            onChange={(e) => setValue((p) => ({ ...p, periodsPerDay: Number(e.target.value || 0) }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Capacity</Label>
          <div className="h-10 flex items-center rounded-md border px-3 text-sm">
            {slotCapacity} slots / week
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Days</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ALL_DAYS.map((d) => {
            const selected = value.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={
                  selected
                    ? "h-10 rounded-md border bg-primary text-primary-foreground text-sm"
                    : "h-10 rounded-md border bg-background text-sm"
                }
              >
                {dayLabel(d)}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">Total weekly hours: {hoursSum}</div>
        {hoursSum > slotCapacity ? (
          <div className="text-xs text-destructive">
            Weekly hours exceed available slots. Reduce weekly hours or increase days/periods.
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="font-medium">Subjects</div>
          <Button type="button" variant="outline" onClick={addSubject} disabled={generating}>
            Add Subject
          </Button>
        </div>

        {value.subjects.map((row, idx) => (
          <SubjectTeacherInput
            key={idx}
            value={row}
            onChange={(next) => updateSubject(idx, next)}
            onRemove={() => removeSubject(idx)}
            teachers={teachers}
            subjectOptions={subjectOptions}
            disabled={generating || loadingTeachers}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <GenerateButton
          onClick={() => onGenerate(value)}
          disabled={!canGenerate || loadingTeachers}
          loading={generating}
        />
      </div>
    </div>
  );
};

export default TimetableGeneratorForm;
