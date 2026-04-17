/**
 * Background Location Task
 *
 * MUST be imported at the app entry point (index.ts) so the task
 * is registered before any component tries to use it.
 *
 * Uses expo-task-manager + expo-location to receive GPS updates
 * even when the app is in background or the screen is off.
 */
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

export const LOCATION_TASK_NAME = "eae-background-location";

// The active callback is set/cleared by useLocation hook instances.
// Only one consumer at a time (Record or Follow), so a single slot is enough.
let _activeCallback: ((location: Location.LocationObject) => void) | null =
    null;

export function registerLocationCallback(
    cb: (location: Location.LocationObject) => void
) {
    _activeCallback = cb;
}

export function unregisterLocationCallback() {
    _activeCallback = null;
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("[LocationTask] Erro em background:", error.message);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations?.length > 0 && _activeCallback) {
            // Deliver the most recent location to the active consumer
            _activeCallback(locations[locations.length - 1]);
        }
    }
});
