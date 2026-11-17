/** localStorage key for the theme picked with the toggle. Unset means the theme follows the system. */
export const THEME_KEY = 'flick:theme';
/** localStorage key for the editor's code, restored on the next visit. */
export const CODE_KEY = 'flick:code';

/** How long a sandbox lives after the most recent run. The API sets it as the timeout and the client assumes it. */
export const LIFETIME_MS = 60_000;
