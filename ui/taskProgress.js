// Shared task progress, using the actual (possibly accelerated) task duration.
export function taskPercent(task, now) {
    if (now >= task.endsAt) return 100;
    const duration = task.endsAt - task.startedAt;
    if (!(duration > 0) || !Number.isFinite(now)) return 0;
    return Math.max(0, Math.min(100, (now - task.startedAt) / duration * 100));
}
export function taskProgressMarkup(task, now) {
    const percent = taskPercent(task, now);
    return `<div class="progress-track" role="progressbar" aria-label="任务进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor(percent)}"><div class="progress-fill" style="width:${percent}%"></div></div><small class="muted task-progress-label">${Math.floor(percent)}%</small>`;
}
