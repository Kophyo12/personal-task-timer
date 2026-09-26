import { useEffect, useState } from "react";
import TaskTimer from "./components/TaskTimer";
import { API_URL } from "./api";

type Task = {
  id: number;
  name: string;
  target_minutes: number;
  active: boolean;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetHours, setTargetHours] = useState("");

  async function loadTasks() {
    const response = await fetch(`${API_URL}/tasks`);

    const data = await response.json();

    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function createTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const hours = Number(targetHours);

    if (!name.trim() || hours <= 0) {
      return;
    }

    const response = await fetch(
  `${API_URL}/tasks`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name,
          target_minutes: hours * 60,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to create task");
      return;
    }

    setName("");
    setTargetHours("");
    setShowForm(false);

    await loadTasks();
  }

  return (
    <main className="app">
      <section className="notebook">

        <header className="header">
          <div>
            <p className="eyebrow">
              FOCUS TRACKER
            </p>

            <h1>My Timer</h1>

            <p className="subtitle">
              Small sessions. Big progress.
            </p>
          </div>

          <div className="date">
            {new Date().toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              }
            )}
          </div>
        </header>

        <div className="divider" />

        <div className="task-actions">
          <p className="section-label">
            MY TASKS
          </p>

          <button
            className="add-task-button"
            onClick={() =>
              setShowForm(!showForm)
            }
          >
            {showForm ? "× Cancel" : "+ Add Task"}
          </button>
        </div>

        {showForm && (
          <form
            className="add-task-form"
            onSubmit={createTask}
          >
            <div className="form-field">
              <label>Task name</label>

              <input
                type="text"
                placeholder="Japanese"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Target hours</label>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="50"
                value={targetHours}
                onChange={(event) =>
                  setTargetHours(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              className="create-task-button"
              type="submit"
            >
              Create Task →
            </button>
          </form>
        )}

        <section className="task-list">
          {tasks.map((task) => (
            <TaskTimer
              key={task.id}
              taskId={task.id}
            />
          ))}
        </section>

      </section>
    </main>
  );
}

export default App;