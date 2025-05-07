import { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  isActive?: boolean;
  onUpdate: (id: number, completed: boolean) => void;
}

export default function TaskItem({ task, isActive = false, onUpdate }: TaskItemProps) {
  // Format time as hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate progress if this is an active task
  const progress = task.timeSpent > 0 && task.timeAllocation > 0 
    ? Math.min(Math.round((task.timeSpent / task.timeAllocation) * 100), 100)
    : 0;

  return (
    <div 
      className={cn(
        "flex items-start space-x-3 p-3 border rounded-lg",
        task.completed ? "border-gray-100" : "border-gray-100 hover:bg-gray-50",
        isActive ? "border-2 border-primary-200 bg-primary-50" : ""
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={(checked) => onUpdate(task.id, checked === true)}
          id={`task-${task.id}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <label 
            htmlFor={`task-${task.id}`}
            className={cn(
              "text-sm font-medium cursor-pointer",
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            )}
          >
            {task.description}
          </label>
          <span className="text-xs font-medium text-gray-500">{formatTime(task.timeAllocation)}</span>
        </div>
        
        {/* Show progress bar for active task */}
        {isActive && !task.completed && (
          <div className="mt-1 flex items-center">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-gray-500">{formatTime(task.timeSpent)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
