import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css"; // Styles are now imported from the external file
import loginBg from "./assets/login_bg.webp"; // Image is a placeholder
import Footer from "./footer"; // Placeholder
import Navbar from "./header"; // Placeholder


// --- NEW: Fading Notification Component ---
const Notification = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for fade-out transition
      }, 3000); // 3 seconds visible

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const style = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 25px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
    zIndex: 2000,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Poppins, sans-serif'
  };

  return <div style={style}>{message}</div>;
};
// ------------------------------------------


export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  // --- NEW: Notification State ---
  const [notification, setNotification] = useState({ message: '', type: '' });

  // --- State for Signup Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  // --- NEW: Phone and Address State ---
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirmPass, setShowSignupConfirmPass] = useState(false);
  const [signupError, setSignupError] = useState("");


  const togglePassword = () => {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    }
  };

  const handleCloseNotification = () => {
    setNotification({ message: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setNotification({ message: '', type: '' }); // Clear any previous notification

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save user data to localStorage
      if (data.user) {
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userId", data.user.id);
      }

      if (data.token) {
        localStorage.setItem("token", data.token); // Save the token!
      }
      
      // Replace alert with fading notification
      setNotification({ message: "Login successful! Redirecting...", type: 'success' });
      // Wait for notification to show before navigating
      setTimeout(() => {
        navigate(data.redirect); 
      }, 1500); // 1.5 seconds wait time

    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes("Unexpected token '<'")) {
        setLoginError("Login failed: Could not connect to server. Is it running?");
      } else {
        setLoginError(err.message);
      }
    }
  };

  // --- Modal Functions ---
  const openModal = () => {
    setIsModalOpen(true);
    setSignupError("");
    setNotification({ message: '', type: '' });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSignupName("");
    setSignupEmail("");
    setSignupPhone(""); // Clear Phone
    setSignupAddress(""); // Clear Address
    setSignupPassword("");
    setSignupConfirmPassword("");
    setShowSignupPass(false);
    setShowSignupConfirmPass(false);
    setSignupError("");
  };

  // --- UPDATED: handleSignupSubmit now includes Phone & Address validation ---
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    // Basic Empty Check
    if (!signupName || !signupEmail || !signupPhone || !signupAddress || !signupPassword) {
        setSignupError("All fields are required.");
        return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match!");
      return;
    }
    
    // Password must be 8 characters
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters long.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: signupName,
          email: signupEmail,
          phone_number: signupPhone,     // --- NEW ---
          shipping_address: signupAddress, // --- NEW ---
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }
      
      // Replace alert with fading notification
      setNotification({ message: "Sign up successful! You can now log in.", type: 'success' });
      closeModal();

    } catch (err) {
      console.error("Signup error:", err);
        if (err.message.includes("Unexpected token '<'")) {
           setSignupError("Signup failed: Could not connect to server.");
        } else {
           setSignupError(err.message); // Show error in modal
        }
    }
  };

  return (
    <div className="page">
      <style>{`
        /* --- INLINED CSS FOR NEW/MODIFIED STYLES --- */
        
        /* Ensures full page takes up vertical space, needed for footer placement */
        .page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* Styles for error/success text fields in the main form */
        .login-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 10px;
          height: 1.2em; /* Reserve space */
        }
        
        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        /* Modal Content Container */
        .modal-content {
          background-color: #fff;
          padding: 30px 40px;
          border-radius: 12px;
          width: 95%;
          max-width: 500px; /* Adjusted width for better form layout */
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          max-height: 90vh; /* Prevent overflow on small screens */
          overflow-y: auto; /* Scroll if too tall */
        }
        /* Modal Heading */
        .modal-content h1 {
          color: #4a2f0c;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }
        
        /* Modal Form Group */
        .modal-form .form-group {
          position: relative;
          margin-bottom: 15px;
        }
        
        /* Modal Input Label */
        .modal-form label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #6a4b22;
          margin-bottom: 5px;
          display: block;
        }

        /* Modal Input Styling (Detailed for modern look) */
        .modal-form input[type="text"],
        .modal-form input[type="email"],
        .modal-form input[type="tel"],
        .modal-form textarea,
        .modal-form input[type="password"] {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e6dcaa;
          border-radius: 8px; /* slightly less rounded for standard inputs */
          background-color: #fff;
          font-size: 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          font-family: 'Poppins', sans-serif;
        }
        
        .modal-form textarea {
            resize: vertical;
            min-height: 60px;
        }

        /* Modal Input Hover/Focus */
        .modal-form input:hover, .modal-form textarea:hover {
          border-color: #c49f6c;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        .modal-form input:focus, .modal-form textarea:focus {
          border: 2px solid #000000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          outline: none;
          background-color: #fafafa;
        }
        
        /* Modal Password Toggle Wrapper */
        .modal-password-wrapper {
          position: relative;
        }
        
        /* Modal Password Toggle Button */
        .modal-toggle-password {
          position: absolute;
          right: 15px;
          top: 50%; 
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 13px; 
          user-select: none;
          color: #888;
          font-weight: 600;
        }

        /* Modal Error Text */
        .modal-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 10px;
          height: 1.2em;
        }
        
        /* Modal Buttons Container */
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        /* Modal Button Shared Styles */
        .cancel-btn, .signup-btn-modal {
          flex: 1;
          height: 45px;
          padding: 12px 0;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          font-size: 15px;
        }


        /* --- END INLINED CSS --- */
      `}</style>
      <Navbar />
      
      {/* --- Notification Display --- */}
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={handleCloseNotification} 
      />

      <section className="page-bg">
        <div className="login-container">
          <div className="login-left">
            <img 
              src={loginBg} 
              alt="Room Decor" 
              onError={(e) => e.target.src = 'https://placehold.co/800x700'}
            />
          </div>

          <div className="login-right">
            <h1>Welcome!</h1>
            <p className="subtitle">Log in to your account to continue.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="password-wrapper">
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="toggle-password" onClick={togglePassword}>
                  👁
                </span>
              </div>
              <div className="login-error">{loginError}</div> 
              <button type="submit" className="login-btn">
                LOG IN
              </button>
            </form>
            <p className="signup-text">
              Don’t have an account?{' '}
              <span className="signup-link" onClick={openModal}>
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </section>
      <Footer />

      {/* --- Signup Modal --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h1>Create Account</h1>
            <form onSubmit={handleSignupSubmit} className="modal-form">
              
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              
              {/* --- NEW: Phone Number Field --- */}
              <div className="form-group">
                <label htmlFor="signup-phone">Phone Number</label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="e.g. 09123456789"
                  required
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                />
              </div>

              {/* --- NEW: Address Field --- */}
              <div className="form-group">
                <label htmlFor="signup-address">Shipping Address</label>
                <textarea
                  id="signup-address"
                  placeholder="Full address for delivery"
                  required
                  value={signupAddress}
                  onChange={(e) => setSignupAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-pass">Password</label>
                <div className="modal-password-wrapper">
                  <input
                    id="signup-pass"
                    type={showSignupPass ? "text" : "password"}
                    placeholder="Enter password (min 8 chars)"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <span className="modal-toggle-password" onClick={() => setShowSignupPass(!showSignupPass)}>
                    {showSignupPass ? "Hide" : "Show"}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm-pass">Confirm Password</label>
                <div className="modal-password-wrapper">
                  <input
                    id="signup-confirm-pass"
                    type={showSignupConfirmPass ? "text" : "password"}
                    placeholder="Confirm password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  />
                  <span className="modal-toggle-password" onClick={() => setShowSignupConfirmPass(!showSignupConfirmPass)}>
                    {showSignupConfirmPass ? "Hide" : "Show"}
                  </span>
                </div>
              </div>

              <div className="modal-error">{signupError}</div> 

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="signup-btn-modal">
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}