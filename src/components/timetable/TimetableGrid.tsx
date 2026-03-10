import { cn } from "@/lib/utils";

import type { TimetableEntry } from "@/pages/Timetable";

export type GridCellKey = {
  day: TimetableEntry["day"];
  period: number;
};

const DAYS: TimetableEntry["day"][] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function dayLabel(day: TimetableEntry["day"]) {
  return day.slice(0, 1) + day.slice(1).toLowerCase();
}

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function teacherLabel(t?: Teacher) {
  if (!t) return "";
  const name = `${t.firstName || ""} ${t.lastName || ""}`.trim();
  if (name) return name;
  return t.email || t._id;
}

const TimetableGrid = ({
  periods,
  entries,
  teacherById,
  onCellClick,
  loading,
}: {
  periods: number;
  entries: TimetableEntry[];
  teacherById: Map<string, Teacher>;
  onCellClick: (key: GridCellKey) => void;
  loading: boolean;
}) => {
  const byKey = new Map<string, TimetableEntry>();
  for (const e of entries) {
    byKey.set(`${e.day}::${e.period}`, e);
  }

  return (
    <div className="w-full overflow-auto">
      <div
        className={cn(
          "min-w-[900px] rounded-md border",
          loading && "opacity-70",
        )}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `200px repeat(${periods}, minmax(160px, 1fr))`,
          }}
        >
          <div className="p-3 font-medium border-b bg-muted">Day</div>
          {Array.from({ length: periods }).map((_, i) => (
            <div key={i} className="p-3 font-medium border-b border-l bg-muted">
              Period {i + 1}
            </div>
          ))}

          {DAYS.map((day) => (
            <div key={day} className="contents">
              <div className="p-3 font-medium border-b">{dayLabel(day)}</div>
              {Array.from({ length: periods }).map((_, idx) => {
                const period = idx + 1;
                const entry = byKey.get(`${day}::${period}`);
                const teacher = entry?.teacherId ? teacherById.get(String(entry.teacherId)) : undefined;

                return (
                  <button
                    key={`${day}-${period}`}
                    type="button"
                    onClick={() => onCellClick({ day, period })}
                    className={cn(
                      "text-left p-3 border-b border-l hover:bg-accent transition-colors",
                      "bg-background",
                    )}
                  >
                    {entry ? (
                      <div className="space-y-1">
                        <div className="font-medium leading-snug">{entry.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {teacherLabel(teacher)}
                          {entry.room ? ` • ${entry.room}` : ""}
                        </div>
                        {(entry.startTime || entry.endTime) && (
                          <div className="text-xs text-muted-foreground">
                            {(entry.startTime || "").trim()}-{(entry.endTime || "").trim()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Add</div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
