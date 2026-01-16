import React from "react";

const GroupTaskPage: React.FC = () => {
  // TODO: Fetch group tasks from API
  const groupTasks = [
    {
      id: "1",
      groupId: "group1",
      priority: "high",
      status: "in_progress",
      requirement: "Requirement 1",
      delivery: "Delivery 1",
      note: "Note 1",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Group Tasks</h1>

      <div className="space-y-4">
        {groupTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">Task {task.id}</h3>
                <p className="text-sm text-gray-500">
                  Priority: {task.priority} | Status: {task.status}
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p>
                <span className="font-medium">Requirement:</span> {task.requirement}
              </p>
              <p>
                <span className="font-medium">Delivery:</span> {task.delivery}
              </p>
              {task.note && (
                <p>
                  <span className="font-medium">Note:</span> {task.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupTaskPage;
