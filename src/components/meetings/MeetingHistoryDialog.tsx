import React from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getGroupMeetings,
  getMeetingRecordings,
  type Meeting,
  type MeetingRecording,
} from "@/lib/api/meetings";

type MeetingWithRecordings = Meeting & {
  recordings: MeetingRecording[];
};

interface MeetingHistoryDialogProps {
  groupId: string;
}

const formatBytes = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const MeetingHistoryDialog: React.FC<MeetingHistoryDialogProps> = ({ groupId }) => {
  const { data, isLoading, isError, refetch } = useQuery<MeetingWithRecordings[]>({
    queryKey: ["meeting-history", groupId],
    queryFn: async () => {
      const meetingList = await getGroupMeetings(groupId);
      const enriched = await Promise.all(
        meetingList.map(async (meeting) => {
          try {
            const recordings = await getMeetingRecordings(meeting.meetingId);
            return { ...meeting, recordings };
          } catch {
            return { ...meeting, recordings: [] };
          }
        })
      );
      return enriched;
    },
    enabled: !!groupId,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Meeting History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meeting History</DialogTitle>
          <DialogDescription>
            View all meetings and recording metadata in this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading meeting history...</p> : null}
          {isError ? <p className="text-sm text-red-500">Failed to load meeting history.</p> : null}

          {!isLoading && !isError && data?.length === 0 ? (
            <p className="text-sm text-gray-500">No meeting history yet.</p>
          ) : null}

          {data?.map((meeting) => (
            <div key={meeting.meetingId} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{meeting.title}</p>
                  <p className="text-xs text-gray-500">Code: {meeting.meetingCode}</p>
                  <p className="text-xs text-gray-500">
                    Started: {meeting.startTime ? new Date(meeting.startTime).toLocaleString() : "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ended: {meeting.endTime ? new Date(meeting.endTime).toLocaleString() : "-"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    meeting.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {meeting.isActive ? "Active" : "Ended"}
                </span>
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Recordings ({meeting.recordings.length})
                </p>

                {meeting.recordings.length === 0 ? (
                  <p className="text-xs text-gray-500">No recordings for this meeting.</p>
                ) : (
                  <div className="space-y-2">
                    {meeting.recordings.map((recording) => (
                      <div key={recording.recordingId} className="bg-gray-50 rounded-md p-2 text-xs">
                        <p>
                          <span className="font-medium">Path:</span> {recording.storagePath}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span>{" "}
                          {recording.duration ? `${recording.duration}s` : "-"}
                        </p>
                        <p>
                          <span className="font-medium">Size:</span> {formatBytes(recording.size)}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span> {recording.status || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(recording.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
