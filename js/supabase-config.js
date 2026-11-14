
/* =========================================
   CHANGE MAKER ACADEMY
   SUPABASE CONNECTION
========================================= */

(function () {
  "use strict";

  // SUPABASE PROJECT URL
  const SUPABASE_URL =
    "https://egldvxcwtdpqbjreojsq.supabase.co";

  // SUPABASE PUBLISHABLE KEY
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5PuGPLVHz9J6oy5aKdgnYg_hsJDg6T8";

  // CHECK SUPABASE LIBRARY
  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "Supabase library not loaded. Check the CDN script."
    );
    window.cmaSupabase = null;
    return;
  }

  // CHECK PUBLISHABLE KEY
  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    !SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
  ) {
    console.error(
      "Invalid Supabase Publishable Key."
    );
    window.cmaSupabase = null;
    return;
  }

  // CREATE SUPABASE CLIENT
  try {
    window.cmaSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.log(
      "Change Maker Academy Supabase client initialized successfully."
    );

  } catch (error) {
    window.cmaSupabase = null;

    console.error(
      "Supabase connection setup failed:",
      error
    );
  }

})();
