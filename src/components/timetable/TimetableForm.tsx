import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import TeacherSelect from "@/components/timetable/TeacherSelect";
import SubjectSelect from "@/components/timetable/SubjectSelect";

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type TimetableFormValue = {
  subject: string;
  teacherId: string;
  room: string;
  startTime: string;
  endTime: string;
};

const TimetableForm = ({
  open,
  onOpenChange,
  title,
  teachers,
  subjectOptions,
  initialValue,
  onSave,
  onDelete,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  teachers: Teacher[];
  subjectOptions: string[];
  initialValue: TimetableFormValue;
  onSave: (value: TimetableFormValue) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
}) => {
  const [value, setValue] = useState<TimetableFormValue>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, open]);

  const canSave = value.subject.trim() && value.teacherId.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <SubjectSelect
              value={value.subject}
              onChange={(v) => setValue((p) => ({ ...p, subject: v }))}
              options={subjectOptions}
            />
          </div>

          <div className="space-y-2">
            <Label>Teacher</Label>
            <TeacherSelect
              value={value.teacherId}
              onChange={(v) => setValue((p) => ({ ...p, teacherId: v }))}
              teachers={teachers}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={value.room}
                onChange={(e) => setValue((p) => ({ ...p, room: e.target.value }))}
                placeholder="Room"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                value={value.startTime}
                onChange={(e) => setValue((p) => ({ ...p, startTime: e.target.value }))}
                placeholder="HH:MM"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                value={value.endTime}
                onChange={(e) => setValue((p) => ({ ...p, endTime: e.target.value }))}
                placeholder="HH:MM"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="w-full sm:w-auto">
            {onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete()}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onSave(value)}
              disabled={!canSave || saving}
              className="w-full sm:w-auto"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableForm;
