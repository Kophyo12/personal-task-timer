import { useEffect, useState } from "react";
import { API_URL } from "../api";

type Progress = {
  task_id: number;
  name: string;
  target_minutes: number;
  completed_minutes: number;
  remaining_minutes: number;
  is_running: boolean;
  current_start_time: string | null;
};

type Props = {
  taskId: number;
};

function TaskTimer({ taskId }: Props) {
  const [progress, setProgress] =
    useState<Progress | null>(null);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  async function loadProgress() {
    const response = await fetch(
  `${API_URL}/tasks/${taskId}/progress`
);

    const data = await response.json();

    setProgress(data);
  }

  useEffect(() => {
    loadProgress();
  }, [taskId]);

  useEffect(() => {
    if (
      progress === null ||
      !progress.is_running ||
      progress.current_start_time === null
    ) {
      setElapsedSeconds(0);
      return;
    }

    function updateTimer() {
      if (!progress?.current_start_time) {
        setElapsedSeconds(0);
        return;
      }

      const start = new Date(
        progress.current_start_time
      ).getTime();

      const now = Date.now();

      if (Number.isNaN(start)) {
        setElapsedSeconds(0);
        return;
      }

      const seconds = Math.max(
        0,
        Math.floor((now - start) / 1000)
      );

      setElapsedSeconds(seconds);
    }

    updateTimer();

    const interval = setInterval(
      updateTimer,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [progress]);

  async function handleTimer() {
    if (progress === null) {
      return;
    }

    const action = progress.is_running
      ? "pause"
      : "start";

    const response = await fetch(
  `${API_URL}/tasks/${taskId}/${action}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      console.error("Timer request failed");
      return;
    }

    await loadProgress();
  }

  function formatTime(totalSeconds: number) {
    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  function formatMinutes(totalMinutes: number) {
    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  if (progress === null) {
    return (
      <div className="task-card">
        <p>Loading...</p>
      </div>
    );
  }

  const percentage = Math.min(
    (progress.completed_minutes /
      progress.target_minutes) *
      100,
    100
  );

  return (
    <article
      className={`task-card ${
        progress.is_running ? "running" : ""
      }`}
    >
      <div className="task-top">
        <div>
          <div className="task-title-row">
            <span
              className={`status-dot ${
                progress.is_running
                  ? "status-running"
                  : ""
              }`}
            />

            <h2>{progress.name}</h2>
          </div>

          <p className="goal">
            Goal{" "}
            {formatMinutes(
              progress.target_minutes
            )}
          </p>
        </div>

        <span className="percentage">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="stats">
        <div className="stat">
          <span>Completed</span>
          <strong>
            {formatMinutes(
              progress.completed_minutes
            )}
          </strong>
        </div>

        <div className="stat">
          <span>Remaining</span>
          <strong>
            {formatMinutes(
              progress.remaining_minutes
            )}
          </strong>
        </div>
      </div>

      <div className="timer-section">
        <p className="timer-label">
          {progress.is_running
            ? "CURRENT SESSION"
            : "READY TO FOCUS"}
        </p>

        <div className="timer">
          {formatTime(elapsedSeconds)}
        </div>

        <button
          className={`timer-button ${
            progress.is_running
              ? "pause-button"
              : ""
          }`}
          onClick={handleTimer}
        >
          <span className="button-icon">
            {progress.is_running ? "Ⅱ" : "▶"}
          </span>

          {progress.is_running
            ? "Pause"
            : "Start"}
        </button>
      </div>
    </article>
  );
}

export default TaskTimer;