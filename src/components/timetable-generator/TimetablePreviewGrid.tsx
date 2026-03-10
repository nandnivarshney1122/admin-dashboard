import { cn } from "@/lib/utils";

import type { TimetableEntry } from "@/pages/AITimetableGenerator";

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const DEFAULT_DAYS: TimetableEntry["day"][] = [
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

function teacherLabel(t?: Teacher) {
  if (!t) return "";
  const name = `${t.firstName || ""} ${t.lastName || ""}`.trim();
  if (name) return name;
  return t.email || t._id;
}

const TimetablePreviewGrid = ({
  entries,
  teacherById,
}: {
  entries: TimetableEntry[];
  teacherById: Map<string, Teacher>;
}) => {
  const daysInResult = new Set(entries.map((e) => e.day));
  const days = DEFAULT_DAYS.filter((d) => daysInResult.has(d));

  const maxPeriod = entries.reduce((m, e) => Math.max(m, Number(e.period) || 0), 0);
  const periods = maxPeriod || 0;

  const byKey = new Map<string, TimetableEntry>();
  for (const e of entries) {
    byKey.set(`${e.day}::${e.period}`, e);
  }

  if (entries.length === 0) {
    return <div className="text-sm text-muted-foreground">No generated timetable yet.</div>;
  }

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[900px] rounded-md border">
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

          {days.map((day) => (
            <div key={day} className="contents">
              <div className="p-3 font-medium border-b">{dayLabel(day)}</div>
              {Array.from({ length: periods }).map((_, idx) => {
                const period = idx + 1;
                const entry = byKey.get(`${day}::${period}`);
                const teacher = entry?.teacherId ? teacherById.get(String(entry.teacherId)) : undefined;

                return (
                  <div
                    key={`${day}-${period}`}
                    className={cn("p-3 border-b border-l", entry ? "bg-background" : "bg-muted/20")}
                  >
                    {entry ? (
                      <div className="space-y-1">
                        <div className="font-medium leading-snug">{entry.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {teacherLabel(teacher)}
                          {entry.room ? ` • ${entry.room}` : ""}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Free</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimetablePreviewGrid;
