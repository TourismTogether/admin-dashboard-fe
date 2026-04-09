import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createMeeting, joinMeeting } from "@/lib/api/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Video, Plus } from "lucide-react";

interface CreateMeetingDialogProps {
  groupTaskId: string;
  groupId: string;
  disabled?: boolean;
  onMeetingCreated: (meetingId: string, meetingTitle: string) => void;
}

export const CreateMeetingDialog: React.FC<CreateMeetingDialogProps> = ({
  groupTaskId,
  groupId,
  disabled,
  onMeetingCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMeetingMutation = useMutation({
    mutationFn: (data: {
      groupTaskId: string;
      groupId: string;
      title: string;
      description?: string;
    }) => createMeeting(data),
    onSuccess: (meeting) => {
      toast.success("Meeting created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      onMeetingCreated(meeting.meetingId, meeting.title);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create meeting");
    },
  });

  const handleCreateMeeting = () => {
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    createMeetingMutation.mutate({
      groupTaskId,
      groupId,
      title,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={disabled}>
          <Video className="w-4 h-4" />
          Start Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for this group task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Group Discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this meeting"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={createMeetingMutation.isPending}
            >
              {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface JoinMeetingDialogProps {
  onMeetingJoined: (meetingId: string, meetingTitle: string) => void;
}

export const JoinMeetingDialog: React.FC<JoinMeetingDialogProps> = ({
  onMeetingJoined,
}) => {
  const [open, setOpen] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");

  const joinMeetingMutation = useMutation({
    mutationFn: (code: string) => joinMeeting(code),
    onSuccess: (meeting) => {
      toast.success("Joined meeting successfully");
      setOpen(false);
      setMeetingCode("");
      onMeetingJoined(meeting.meetingId, meeting.title);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to join meeting. Invalid code?");
    },
  });

  const handleJoinMeeting = () => {
    if (!meetingCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }

    joinMeetingMutation.mutate(meetingCode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Join Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Meeting</DialogTitle>
          <DialogDescription>
            Enter the meeting code to join an existing meeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Meeting Code</Label>
            <Input
              id="code"
              placeholder="e.g., ABC123XYZ"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleJoinMeeting}
              disabled={joinMeetingMutation.isPending}
            >
              {joinMeetingMutation.isPending ? "Joining..." : "Join Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
