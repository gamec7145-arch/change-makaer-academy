
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
  // এখানে নিজের সম্পূর্ণ sb_publishable_... Key বসাও।
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5PuGPLVHz9J6oy5aKdgnYg_hsJDg6T8"


  // CHECK SUPABASE LIBRARY
  if (!window.supabase) {
    console.error(
      "Supabase library not loaded. Check the CDN script."
    );
    return;
  }


  // CHECK PUBLISHABLE KEY
  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY ===
      "sb_publishable_5PuGPLVHz9J6oy5aKdgnYg_hsJDg6T8"
  ) {
    console.error(
      "Supabase Publishable Key is missing."
    );
    return;
  }


  // CREATE SUPABASE CLIENT
  try {

    window.cmaSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.log(
      "Change Maker Academy Supabase connected successfully."
    );

  } catch (error) {

    window.cmaSupabase = null;

    console.error(
      "Supabase connection setup failed:",
      error
    );

  }

})();
