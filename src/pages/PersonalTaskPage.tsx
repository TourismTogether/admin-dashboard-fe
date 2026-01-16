import React, { useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks, getWeek } from "date-fns";

const PersonalTaskPage: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekNumber = getWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = addWeeks(weekStart, 1);

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // TODO: Fetch tasks from API
  const tasks = [
    {
      id: "1",
      content: "Task 1",
      status: "todo",
      priority: "high",
      swimlaneId: "swim1",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Personal Tasks</h1>
        
        {/* Week Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Previous
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-semibold">
              Week {weekNumber} - {format(weekStart, "MMM d")} to{" "}
              {format(weekEnd, "MMM d, yyyy")}
            </h2>
          </div>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next →
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
        </div>
      </div>

      {/* Tasks by Week */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Swimlanes</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{task.content}</p>
                    <p className="text-sm text-gray-500">
                      Status: {task.status} | Priority: {task.priority}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalTaskPage;
