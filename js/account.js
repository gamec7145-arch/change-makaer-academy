
/* =========================================
   CHANGE MAKER ACADEMY
   STUDENT ACCOUNT & AUTHENTICATION
========================================= */

(function () {
  "use strict";

  const supabaseClient = window.cmaSupabase;

  const LOGIN_ERROR =
    "Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";

  window.cmaStudentSession = null;

  function getPageContent() {
    return document.getElementById("pageContent");
  }

  function showMessage(message, type) {
    const box = document.getElementById("cmaAccountMessage");
    if (!box) return;

    box.textContent = message;
    box.style.color = type === "success" ? "#68DDB9" : "#ff8585";
  }

  function accountStyles() {
    return `
      <style>
        .cma-account-wrap {
          max-width: 480px;
          margin: 20px auto;
          padding: 22px;
          background: var(--card, #103E4C);
          border: 1px solid var(--border, #245563);
          border-radius: 16px;
          color: var(--white, #fff);
        }

        .cma-account-wrap h2 {
          margin: 0 0 8px;
          font-size: 23px;
        }

        .cma-account-subtitle {
          color: var(--muted, #A8C0CE);
          font-size: 14px;
          margin-bottom: 22px;
        }

        .cma-account-wrap label {
          display: block;
          margin: 14px 0 7px;
          font-size: 14px;
        }

        .cma-account-wrap input {
          box-sizing: border-box;
          width: 100%;
          padding: 13px;
          border: 1px solid var(--border, #245563);
          border-radius: 9px;
          outline: none;
          background: var(--deep, #052D3B);
          color: white;
          font: inherit;
        }

        .cma-account-wrap input:focus {
          border-color: var(--green, #08C99A);
        }

        .cma-account-btn {
          width: 100%;
          padding: 13px;
          margin-top: 17px;
          border: 0;
          border-radius: 9px;
          background: var(--green, #08C99A);
          color: #052D3B;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .cma-account-switch {
          margin-top: 18px;
          text-align: center;
          color: var(--muted, #A8C0CE);
          font-size: 14px;
        }

        .cma-account-link {
          color: var(--mint, #68DDB9);
          font-weight: 700;
          cursor: pointer;
          border: 0;
          background: none;
          font: inherit;
        }

        #cmaAccountMessage {
          min-height: 20px;
          margin-top: 14px;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .cma-account-info {
          padding: 15px;
          background: var(--deep, #052D3B);
          border-radius: 10px;
          margin-top: 18px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }
      </style>
    `;
  }

  function renderLogin() {
    const content = getPageContent();
    if (!content) return;

    content.innerHTML = accountStyles() + `
      <div class="cma-account-wrap">
        <h2>Student Login</h2>
        <div class="cma-account-subtitle">
          Sign in to continue your learning journey.
        </div>

        <form id="cmaLoginForm">
          <label for="cmaLoginEmail">Email Address</label>
          <input
            id="cmaLoginEmail"
            type="email"
            placeholder="Enter your email"
            autocomplete="email"
            required
          >

          <label for="cmaLoginPassword">Password</label>
          <input
            id="cmaLoginPassword"
            type="password"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          >

          <button class="cma-account-btn" type="submit">
            Login
          </button>
        </form>

        <div id="cmaAccountMessage" role="status"></div>

        <div class="cma-account-switch">
          Don't have an account?
          <button class="cma-account-link" id="cmaShowSignup">
            Sign Up
          </button>
        </div>
      </div>
    `;

    document.getElementById("cmaLoginForm").addEventListener(
      "submit",
      handleLogin
    );

    document.getElementById("cmaShowSignup").addEventListener(
      "click",
      renderSignup
    );
  }

  function renderSignup() {
    const content = getPageContent();
    if (!content) return;

    content.innerHTML = accountStyles() + `
      <div class="cma-account-wrap">
        <h2>Create Student Account</h2>
        <div class="cma-account-subtitle">
          Register your account to access student features.
        </div>

        <form id="cmaSignupForm">
          <label for="cmaSignupName">Full Name</label>
          <input
            id="cmaSignupName"
            type="text"
            placeholder="Enter your full name"
            autocomplete="name"
            maxlength="100"
            required
          >

          <label for="cmaSignupEmail">Email Address</label>
          <input
            id="cmaSignupEmail"
            type="email"
            placeholder="Enter your email"
            autocomplete="email"
            required
          >

          <label for="cmaSignupPassword">Password</label>
          <input
            id="cmaSignupPassword"
            type="password"
            placeholder="Create a password"
            autocomplete="new-password"
            minlength="6"
            required
          >

          <button class="cma-account-btn" type="submit">
            Create Account
          </button>
        </form>

        <div id="cmaAccountMessage" role="status"></div>

        <div class="cma-account-switch">
          Already have an account?
          <button class="cma-account-link" id="cmaShowLogin">
            Login
          </button>
        </div>
      </div>
    `;

    document.getElementById("cmaSignupForm").addEventListener(
      "submit",
      handleSignup
    );

    document.getElementById("cmaShowLogin").addEventListener(
      "click",
      renderLogin
    );
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabaseClient) {
      showMessage("Supabase connection is not ready.", "error");
      return;
    }

    const email = document.getElementById("cmaLoginEmail").value.trim();
    const password = document.getElementById("cmaLoginPassword").value;
    const button = event.submitter;

    button.disabled = true;
    button.textContent = "Please wait...";

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      window.cmaStudentSession = data.session;
      renderAccountPage();

    } catch (error) {
      showMessage(error.message || "Login failed.", "error");
      button.disabled = false;
      button.textContent = "Login";
    }
  }

  async function handleSignup(event) {
    event.preventDefault();

    if (!supabaseClient) {
      showMessage("Supabase connection is not ready.", "error");
      return;
    }

    const fullName = document.getElementById("cmaSignupName").value.trim();
    const email = document.getElementById("cmaSignupEmail").value.trim();
    const password = document.getElementById("cmaSignupPassword").value;
    const button = event.submitter;

    if (!fullName) {
      showMessage("Please enter your full name.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Creating account...";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        window.cmaStudentSession = data.session;
        renderAccountPage();
      } else {
        renderLogin();
        showMessage(
          "Account created! Please verify your email, then log in.",
          "success"
        );
      }

    } catch (error) {
      showMessage(error.message || "Account creation failed.", "error");
      button.disabled = false;
      button.textContent = "Create Account";
    }
  }

  async function renderAccountPage() {
    const content = getPageContent();
    if (!content) return;

    if (!supabaseClient) {
      content.innerHTML = accountStyles() + `
        <div class="cma-account-wrap">
          <h2>Account</h2>
          <p id="cmaAccountMessage">
            Supabase connection is not ready. Please check the configuration.
          </p>
        </div>
      `;
      return;
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      renderLogin();
      return;
    }

    const user = data.user;
    const fullName =
      user.user_metadata?.full_name || "Student";

    content.innerHTML = accountStyles() + `
      <div class="cma-account-wrap">
        <h2>My Account</h2>
        <div class="cma-account-subtitle">
          Your student account information.
        </div>

        <div class="cma-account-info">
          <strong>Name:</strong> ${escapeHTML(fullName)}<br>
          <strong>Email:</strong> ${escapeHTML(user.email || "")}<br>
          <strong>Account:</strong> Student
        </div>

        <button class="cma-account-btn" id="cmaLogoutBtn">
          Logout
        </button>

        <div id="cmaAccountMessage" role="status"></div>
      </div>
    `;

    document.getElementById("cmaLogoutBtn").addEventListener(
      "click",
      handleLogout
    );
  }

  async function handleLogout() {
    if (!supabaseClient) return;

    const button = document.getElementById("cmaLogoutBtn");
    if (button) {
      button.disabled = true;
      button.textContent = "Logging out...";
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      if (button) {
        button.disabled = false;
        button.textContent = "Logout";
      }
      showMessage(error.message, "error");
      return;
    }

    window.cmaStudentSession = null;
    renderLogin();
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  window.cmaRequireStudentLogin = async function () {
    if (!supabaseClient) {
      alert("Student login system is not connected yet.");
      return false;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
      alert(LOGIN_ERROR);
      return false;
    }

    window.cmaStudentSession = data.session;
    return true;
  };

  window.renderAccountPage = renderAccountPage;

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(function (_event, session) {
      window.cmaStudentSession = session;
    });
  }

})();
      
