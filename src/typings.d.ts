// Declare typings so that the typescript compiler sees them but so
// that the typed libraries will not be included via requirejs at
// runtime (the html page statically includes them).

import * as __d3 from "d3";
declare global {
  const d3: typeof __d3;
}
