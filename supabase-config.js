
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
    // Login session phone/browser e save thake (localStorage) ebong token
    // auto-refresh hoy, tai student Logout press na kora porjonto login-e thake.
    window.cmaSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
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
