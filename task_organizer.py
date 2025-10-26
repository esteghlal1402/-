#!/usr/bin/env python3
"""
Task Organizer Agent

This agent helps organize tasks based on priority and deadline.
It can add, remove, update, and sort tasks according to various criteria.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import argparse
from enum import Enum

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Task:
    def __init__(self, title: str, description: str = "", priority: Priority = Priority.MEDIUM, 
                 deadline: Optional[datetime] = None, status: TaskStatus = TaskStatus.PENDING):
        self.id = id(self)  # Simple ID generation
        self.title = title
        self.description = description
        self.priority = priority
        self.deadline = deadline
        self.status = status
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def update_status(self, new_status: TaskStatus):
        """Update task status and timestamp"""
        self.status = new_status
        self.updated_at = datetime.now()
    
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        if not self.deadline or self.status == TaskStatus.COMPLETED:
            return False
        return datetime.now() > self.deadline
    
    def days_until_deadline(self) -> Optional[int]:
        """Get days until deadline (negative if overdue)"""
        if not self.deadline:
            return None
        delta = self.deadline - datetime.now()
        return delta.days
    
    def to_dict(self) -> Dict:
        """Convert task to dictionary for serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority.name,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Task':
        """Create task from dictionary"""
        task = cls(
            title=data['title'],
            description=data.get('description', ''),
            priority=Priority[data['priority']],
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
            status=TaskStatus(data['status'])
        )
        task.id = data['id']
        task.created_at = datetime.fromisoformat(data['created_at'])
        task.updated_at = datetime.fromisoformat(data['updated_at'])
        return task
    
    def __str__(self):
        status_icon = {
            TaskStatus.PENDING: "⏳",
            TaskStatus.IN_PROGRESS: "🔄",
            TaskStatus.COMPLETED: "✅",
            TaskStatus.CANCELLED: "❌"
        }
        
        priority_icon = {
            Priority.LOW: "🟢",
            Priority.MEDIUM: "🟡",
            Priority.HIGH: "🟠",
            Priority.URGENT: "🔴"
        }
        
        overdue = "⚠️ OVERDUE" if self.is_overdue() else ""
        deadline_str = f" (Due: {self.deadline.strftime('%Y-%m-%d %H:%M')})" if self.deadline else ""
        
        return f"{status_icon[self.status]} {priority_icon[self.priority]} {self.title}{deadline_str} {overdue}"

class TaskOrganizerAgent:
    def __init__(self, data_file: str = "tasks.json"):
        self.tasks: List[Task] = []
        self.data_file = data_file
        self.load_tasks()
    
    def add_task(self, title: str, description: str = "", priority: Priority = Priority.MEDIUM, 
                 deadline: Optional[datetime] = None) -> Task:
        """Add a new task"""
        task = Task(title, description, priority, deadline)
        self.tasks.append(task)
        self.save_tasks()
        return task
    
    def remove_task(self, task_id: int) -> bool:
        """Remove a task by ID"""
        for i, task in enumerate(self.tasks):
            if task.id == task_id:
                del self.tasks[i]
                self.save_tasks()
                return True
        return False
    
    def update_task_status(self, task_id: int, new_status: TaskStatus) -> bool:
        """Update task status"""
        for task in self.tasks:
            if task.id == task_id:
                task.update_status(new_status)
                self.save_tasks()
                return True
        return False
    
    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """Get tasks filtered by status"""
        return [task for task in self.tasks if task.status == status]
    
    def get_overdue_tasks(self) -> List[Task]:
        """Get all overdue tasks"""
        return [task for task in self.tasks if task.is_overdue()]
    
    def sort_by_priority(self, reverse: bool = True) -> List[Task]:
        """Sort tasks by priority (highest first by default)"""
        return sorted(self.tasks, key=lambda t: t.priority.value, reverse=reverse)
    
    def sort_by_deadline(self) -> List[Task]:
        """Sort tasks by deadline (earliest first)"""
        def sort_key(task):
            if task.deadline is None:
                return datetime.max
            return task.deadline
        
        return sorted(self.tasks, key=sort_key)
    
    def sort_by_priority_and_deadline(self) -> List[Task]:
        """Sort tasks by priority first, then by deadline"""
        def sort_key(task):
            priority_score = task.priority.value
            deadline_score = task.deadline.timestamp() if task.deadline else float('inf')
            return (priority_score, deadline_score)
        
        return sorted(self.tasks, key=sort_key, reverse=True)
    
    def get_today_tasks(self) -> List[Task]:
        """Get tasks due today"""
        today = datetime.now().date()
        return [task for task in self.tasks 
                if task.deadline and task.deadline.date() == today]
    
    def get_this_week_tasks(self) -> List[Task]:
        """Get tasks due this week"""
        today = datetime.now()
        week_end = today + timedelta(days=7)
        return [task for task in self.tasks 
                if task.deadline and today <= task.deadline <= week_end]
    
    def generate_report(self) -> str:
        """Generate a comprehensive task report"""
        report = []
        report.append("📋 TASK ORGANIZER REPORT")
        report.append("=" * 50)
        
        # Summary
        total_tasks = len(self.tasks)
        completed = len(self.get_tasks_by_status(TaskStatus.COMPLETED))
        pending = len(self.get_tasks_by_status(TaskStatus.PENDING))
        in_progress = len(self.get_tasks_by_status(TaskStatus.IN_PROGRESS))
        overdue = len(self.get_overdue_tasks())
        
        report.append(f"Total Tasks: {total_tasks}")
        report.append(f"Completed: {completed}")
        report.append(f"In Progress: {in_progress}")
        report.append(f"Pending: {pending}")
        report.append(f"Overdue: {overdue}")
        report.append("")
        
        # Overdue tasks
        if overdue > 0:
            report.append("🚨 OVERDUE TASKS:")
            for task in self.get_overdue_tasks():
                report.append(f"  {task}")
            report.append("")
        
        # Today's tasks
        today_tasks = self.get_today_tasks()
        if today_tasks:
            report.append("📅 TODAY'S TASKS:")
            for task in today_tasks:
                report.append(f"  {task}")
            report.append("")
        
        # High priority tasks
        high_priority = [t for t in self.tasks if t.priority in [Priority.HIGH, Priority.URGENT] and t.status != TaskStatus.COMPLETED]
        if high_priority:
            report.append("🔥 HIGH PRIORITY TASKS:")
            for task in high_priority:
                report.append(f"  {task}")
            report.append("")
        
        # All tasks sorted by priority and deadline
        report.append("📝 ALL TASKS (sorted by priority and deadline):")
        sorted_tasks = self.sort_by_priority_and_deadline()
        for task in sorted_tasks:
            report.append(f"  {task}")
        
        return "\n".join(report)
    
    def save_tasks(self):
        """Save tasks to JSON file"""
        try:
            data = [task.to_dict() for task in self.tasks]
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving tasks: {e}")
    
    def load_tasks(self):
        """Load tasks from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
                self.tasks = [Task.from_dict(task_data) for task_data in data]
        except FileNotFoundError:
            # File doesn't exist yet, start with empty list
            self.tasks = []
        except Exception as e:
            print(f"Error loading tasks: {e}")
            self.tasks = []

def main():
    parser = argparse.ArgumentParser(description='Task Organizer Agent')
    parser.add_argument('--add', nargs=2, metavar=('TITLE', 'DESCRIPTION'), help='Add a new task')
    parser.add_argument('--priority', choices=['low', 'medium', 'high', 'urgent'], default='medium', help='Task priority')
    parser.add_argument('--deadline', help='Task deadline (YYYY-MM-DD HH:MM)')
    parser.add_argument('--list', action='store_true', help='List all tasks')
    parser.add_argument('--report', action='store_true', help='Generate detailed report')
    parser.add_argument('--complete', type=int, help='Mark task as completed (task ID)')
    parser.add_argument('--remove', type=int, help='Remove task (task ID)')
    parser.add_argument('--overdue', action='store_true', help='Show overdue tasks')
    parser.add_argument('--today', action='store_true', help='Show today\'s tasks')
    
    args = parser.parse_args()
    
    agent = TaskOrganizerAgent()
    
    if args.add:
        title, description = args.add
        priority = Priority[args.priority.upper()]
        deadline = None
        if args.deadline:
            try:
                deadline = datetime.strptime(args.deadline, '%Y-%m-%d %H:%M')
            except ValueError:
                print("Error: Invalid deadline format. Use YYYY-MM-DD HH:MM")
                return
        
        task = agent.add_task(title, description, priority, deadline)
        print(f"✅ Added task: {task}")
    
    elif args.list:
        if agent.tasks:
            for task in agent.sort_by_priority_and_deadline():
                print(task)
        else:
            print("No tasks found.")
    
    elif args.report:
        print(agent.generate_report())
    
    elif args.complete:
        if agent.update_task_status(args.complete, TaskStatus.COMPLETED):
            print(f"✅ Marked task {args.complete} as completed")
        else:
            print(f"❌ Task {args.complete} not found")
    
    elif args.remove:
        if agent.remove_task(args.remove):
            print(f"✅ Removed task {args.remove}")
        else:
            print(f"❌ Task {args.remove} not found")
    
    elif args.overdue:
        overdue = agent.get_overdue_tasks()
        if overdue:
            print("🚨 OVERDUE TASKS:")
            for task in overdue:
                print(f"  {task}")
        else:
            print("✅ No overdue tasks!")
    
    elif args.today:
        today_tasks = agent.get_today_tasks()
        if today_tasks:
            print("📅 TODAY'S TASKS:")
            for task in today_tasks:
                print(f"  {task}")
        else:
            print("✅ No tasks due today!")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()