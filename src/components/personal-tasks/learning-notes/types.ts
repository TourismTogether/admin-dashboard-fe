export interface LearningNote {
  noteId: string;
  userId: string;
  noteDate: string;
  content: string;
  dailyScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLearningNoteInput {
  noteDate: string;
  content: string;
  dailyScore?: number | null;
}
