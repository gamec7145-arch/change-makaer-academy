
/* =========================================
   CHANGE MAKER ACADEMY
   SUPABASE CONNECTION
========================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://egldvxcwtdpqbjreojsq.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "YOUR_SUPABASE_PUBLISHABLE_KEY";

  if (!window.supabase) {
    console.error("Supabase library not loaded.");
    return;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY"
  ) {
    console.error("Please add your Supabase Publishable Key.");
    return;
  }

  window.cmaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Change Maker Academy Supabase connected.");
})();
