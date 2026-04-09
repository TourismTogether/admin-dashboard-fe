import { apiRequest } from "../api";

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || fallback;
  } catch {
    return fallback;
  }
};

export interface Meeting {
  meetingId: string;
  groupTaskId: string;
  groupId: string;
  createdBy: string;
  meetingCode: string;
  title: string;
  description?: string;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  participantId: string;
  meetingId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isPresenting: boolean;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
  };
}

export interface MeetingChat {
  chatId: string;
  meetingId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
  };
}

export interface MeetingRecording {
  recordingId: string;
  meetingId: string;
  storagePath: string;
  duration?: number | null;
  size?: number | null;
  status?: string | null;
  createdAt: string;
}

// Create a new meeting
export const createMeeting = async (data: {
  groupTaskId: string;
  groupId: string;
  title: string;
  description?: string;
}): Promise<Meeting> => {
  const response = await apiRequest("/api/meetings/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to create meeting"));
  }

  const result = await response.json();
  return result.data;
};

// Get meeting details
export const getMeeting = async (meetingId: string): Promise<Meeting> => {
  const response = await apiRequest(`/api/meetings/${meetingId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to fetch meeting"));
  }

  const result = await response.json();
  return result.data;
};

// Join meeting by code
export const joinMeeting = async (meetingCode: string): Promise<Meeting> => {
  const response = await apiRequest("/api/meetings/join", {
    method: "POST",
    body: JSON.stringify({ meetingCode }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to join meeting"));
  }

  const result = await response.json();
  return result.data;
};

// Update participant controls
export const updateMeetingControls = async (
  meetingId: string,
  controls: {
    isMicOn?: boolean;
    isCameraOn?: boolean;
  }
): Promise<MeetingParticipant> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/controls`, {
    method: "PATCH",
    body: JSON.stringify(controls),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to update meeting controls"));
  }

  const result = await response.json();
  return result.data;
};

// Get meeting chats
export const getMeetingChats = async (meetingId: string): Promise<MeetingChat[]> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/chats`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to fetch chats"));
  }

  const result = await response.json();
  return result.data;
};

// Send chat message
export const sendMeetingMessage = async (
  meetingId: string,
  message: string
): Promise<MeetingChat> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/chats`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to send message"));
  }

  const result = await response.json();
  return result.data;
};

// Leave meeting
export const leaveMeeting = async (meetingId: string): Promise<void> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/leave`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to leave meeting"));
  }
};

// Get group meetings
export const getGroupMeetings = async (groupId: string): Promise<Meeting[]> => {
  const response = await apiRequest(`/api/groups/${groupId}/meetings`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to fetch meetings"));
  }

  const result = await response.json();
  return result.data;
};

export const getMeetingRecordings = async (meetingId: string): Promise<MeetingRecording[]> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/recordings`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to fetch recordings"));
  }

  const result = await response.json();
  return result.data;
};

export const createMeetingRecording = async (
  meetingId: string,
  data: {
    storagePath: string;
    duration?: number;
    size?: number;
    status?: string;
  }
): Promise<MeetingRecording> => {
  const response = await apiRequest(`/api/meetings/${meetingId}/recordings`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to save recording"));
  }

  const result = await response.json();
  return result.data;
};
