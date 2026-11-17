/** localStorage key for the editor's code, restored on the next visit. */
export const CODE_KEY = 'flick:code';
/** localStorage flag set once the welcome dialog has been shown, so it appears only on the first visit. */
export const WELCOME_KEY = 'flick:welcome-seen';

/** How long a sandbox lives after the most recent run. The API sets it as the timeout and the client assumes it. */
export const LIFETIME_MS = 60_000;
