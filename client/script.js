let serverUrl = "http://172.16.0.151:3000";

const signupForm = document.querySelector("#signupForm");
const loginForm = document.querySelector("#loginForm");
const testForm = document.querySelector("#testForm");
const message = document.querySelector("#message");
const showSignup = document.querySelector("#showSignup");
const testFormTitle = document.querySelector("#testFormTitle");
const adminDiv = document.querySelector("#adminDiv");
const moderatorDiv = document.querySelector("#moderatorDiv");
const adminTest = document.getElementById('adminTest');
const moderatorTest = document.getElementById('moderatorTest');
const ownerDiv = document.getElementById('ownerDiv');
const addRoleForm = document.getElementById('addRoleForm');


document.querySelector("#logout_button").addEventListener("click", function() {
  // Clear the token from the local storage
  localStorage.removeItem("token");

  // Refresh the page
  location.reload();
});


    window.onload = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${serverUrl}/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            const loginUsername = result.username;
            loginForm.style.display = "none";
            testFormTitle.innerHTML = `Welcome, ${loginUsername}`;
            testForm.style.display = "block";
            message.innerHTML = "Session verified.";
          } else {
            localStorage.removeItem("token");
            console.log("Token removed from localStorage. (Error 1)")
          }
        } catch (error) {
          localStorage.removeItem("token");
          console.log("Token removed from localStorage. (Error 2)")
        }
      }
      adminDiv.style.display = 'none';
      moderatorDiv.style.display = 'none';
      adminTest.style.display = 'none';
      moderatorTest.style.display = 'none';
      ownerDiv.style.display = 'none';
      await updateVisibilityBasedOnRole();
    };

    showSignup.addEventListener("click", e => {
      e.preventDefault();
      signupForm.style.display = "block";
      loginForm.style.display = "none";
    });

    
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const signupUsername = document.querySelector("#signupUsername").value;
    const signupPassword = document.querySelector("#signupPassword").value;

    try {
        const response = await fetch(`${serverUrl}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: signupUsername, password: signupPassword })
        });

        const data = await response.json();

        if (response.status === 200) {
            message.innerHTML = "Signup successful";
            signupForm.style.display = "none";
            loginForm.style.display = "block";
        } else if (response.status === 429) {
            message.innerHTML = "Too many requests. Try again later.";
        } else {
            message.innerHTML = data.error;
        }
    } catch (error) {
        message.innerHTML = "No response from server. Try again later.";
    }
});

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginUsername = document.querySelector("#loginUsername").value;
      const loginPassword = document.querySelector("#loginPassword").value;

      try {
        const response = await fetch(`${serverUrl}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: loginUsername,
            password: loginPassword,
          }),
        });

        const data = await response.json();

        if (response.status === 200) {
          localStorage.setItem("token", data.token);
          loginForm.style.display = "none";
          testFormTitle.innerHTML = `Welcome, ${loginUsername}`;
          testForm.style.display = "block";
          message.innerHTML = data.message;
          await updateVisibilityBasedOnRole();
        } else if (response.status === 429) {
            message.innerHTML = "Too many requests. Try again later.";
        } else {
          message.innerHTML = data.error;
        }
      } catch (error) {
        message.innerHTML = "No response from server. Try again later.";
      }
    });

    testForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${serverUrl}/test`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          message.innerHTML = data.message;
        } else {
          message.innerHTML = data.error;
        }
      } catch (error) {
        message.innerHTML = "Failed to access endpoint.";
      }
    });

    async function getRoles() {
      const token = localStorage.getItem("token");
      if (!token) {
        return [];
      }

      try {
        const response = await fetch(`${serverUrl}/roles`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`
          }
        });

        if (response.ok) {
          const { roles } = await response.json();
          return roles;
        }
      } catch (error) {
        console.log(error);
      }

      return [];
    }

    async function testEndpoint(role, endpoint) {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${serverUrl}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
            "Role": role
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          message.innerHTML = data.message;
        } else {
          message.innerHTML = data.error;
        }
      } catch (error) {
        message.innerHTML = "Failed to access endpoint.";
      }
    }

    
async function updateVisibilityBasedOnRole() {
  const userRoles = await getRoles();
  
  if (userRoles.includes('admin')) {
    adminDiv.style.display = 'block';
    adminTest.style.display = 'block';
  }
  if (userRoles.includes('admin') || userRoles.includes('moderator')) {
    moderatorDiv.style.display = 'block';
    moderatorTest.style.display = 'block';
  }
  if (userRoles.includes('owner')) {
  ownerDiv.style.display = 'block';
  addRoleForm.style.display = 'block';
  }
}

function displayMessage(message, isSuccess) {
    var messageDiv = document.getElementById("message");
    messageDiv.textContent = message;
    messageDiv.style.color = isSuccess ? "green" : "red";
}

document.getElementById('addRoleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usernameToAdjust = document.getElementById('username').value;
  const roleToAdd = document.getElementById('role').value;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${serverUrl}/owner/addRole`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ username: usernameToAdjust, role: roleToAdd })
      
      
    });

    if (!response.ok) {
      throw new Error(`--> HTTP Status: ${response.status} Error: ${response.error}`);
    }

    const data = await response.json();
    console.log(data);
    displayMessage(`Role "${roleToAdd}" added to "${usernameToAdjust}" successfully`, true);
  } catch (error) {
    console.error(error);
    displayMessage(`Failed to add role "${roleToAdd}" to "${usernameToAdjust}" (Invalid username?)`, false);
  }
});

// Update the event listener for the remove role form submission
document.getElementById('removeRoleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usernameToAdjust = document.getElementById('removeRoleUsername').value;
  const roleToRemove = document.getElementById('removeRole').value;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${serverUrl}/owner/removeRole`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ username: usernameToAdjust, role: roleToRemove })
    });

    if (!response.ok) {
      throw new Error(`--> HTTP Status: ${response.status} Error: ${response.error}`);
    }

    const data = await response.json();
    console.log(data); // Optional: Log response for debugging
    displayMessage(`Role "${roleToRemove}" removed from "${usernameToAdjust}" successfully`, true);

  } catch (error) {
    console.error(error);
    displayMessage(`Failed to remove role "${roleToRemove}" from "${usernameToAdjust}" (Invalid username?)`, false);
  }
});


document.getElementById('ownerTest').addEventListener('click', async (e) => {
  e.preventDefault();
  testEndpoint('owner', '/owner');
});

document.getElementById('adminTest').addEventListener('click', async (e) => {
  e.preventDefault();
  testEndpoint('admin', '/admin');
});

document.getElementById('moderatorTest').addEventListener('click', async (e) => {
  e.preventDefault();
  testEndpoint('moderator', '/moderator');
});