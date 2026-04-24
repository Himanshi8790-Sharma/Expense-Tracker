"use client";

import { useRef, useState } from "react";
import API from "../services/api";
import Swal from "sweetalert2";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// import { title } from "process";
import "../auth.css";

export default function Login() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showRegister = () => wrapperRef.current?.classList.add("active");
  const showLogin = () => wrapperRef.current?.classList.remove("active");

  // State for handling login form inputs
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Login API
  const loginMutation = useMutation({
    mutationFn: (data: typeof loginData) => API.post("/auth/login", data),
    onSuccess: (res) => {
      console.log("API RESPONSE:", res.data);

      localStorage.setItem("token", res.data.token);
      // localStorage.removeItem("token");
      setLoginData({ email: "", password: "" });
      Swal.fire({
        icon: "success",
        title: "Login Successful 🎉",
        text: "Welcome back!",
      });

      navigate("/dashboard"); // ✅ only once
    },
    onError: (err: any) => {
      Swal.fire({
        icon: "error",
        title: "Login Failed ❌",
        text: err.response?.data?.error || "Something went wrong",
      });
    },
  });

  // 🔥 SIGNUP API
  const signupMutation = useMutation({
    mutationFn: (data: typeof signupData) => API.post("/auth/signup", data),

    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Account Created 🎉",
        // text: "Now login to continue",
      });

      navigate("/dashboard"); // ✅ only once
      // showLogin();
    },

    onError: (err: any) => {
      Swal.fire({
        icon: "error",
        title: "Signup Failed ❌",
        text: err.response?.data?.error || "Something went wrong",
      });
    },
  });

  return (
    <div className="auth-root">
      <div className="auth-wrapper" ref={wrapperRef}>
        <span className="bg-animate"></span>
        <span className="bg-animate2"></span>

        {/* ───── LOGIN FORM ───── */}
        <div className="form-box login">
          <h2
            className="animation"
            style={{ "--i": 0, "--j": 21 } as React.CSSProperties}
          >
            Login
          </h2>
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate(loginData);
            }}
          >
            <div
              className="input-box animation"
              style={{ "--i": 1, "--j": 22 } as React.CSSProperties}
            >
              <input
                type="text"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                autoComplete="off"
              />
              <label>Email 📧</label>
            </div>
            <div
              className="input-box animation"
              style={{ "--i": 2, "--j": 23 } as React.CSSProperties}
            >
              <input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                autoComplete="off"
              />
              <label>Password 🔒</label>
            </div>
            <button
              type="submit"
              className="btn animation"
              style={{ "--i": 3, "--j": 24 } as React.CSSProperties}
            >
              {loginMutation.isPending ? "Loading..." : "Login"}
            </button>
            <div
              className="logreg-link animation"
              style={{ "--i": 4, "--j": 25 } as React.CSSProperties}
            >
              <p>
                Don&apos;t have an account?{" "}
                <span className="register-link" onClick={showRegister}>
                  Sign Up
                </span>
              </p>
            </div>
          </form>
        </div>

        {/* ───── LOGIN INFO ───── */}
        <div className="info-text login">
          <h2
            className="animation"
            style={{ "--i": 0, "--j": 20 } as React.CSSProperties}
          >
            Welcome Back!
          </h2>
          <p
            className="animation"
            style={{ "--i": 1, "--j": 21 } as React.CSSProperties}
          >
            Login to continue managing your expenses efficiently.
          </p>
        </div>

        {/* ───── REGISTER FORM ───── */}
        <div className="form-box register">
          <h2
            className="animation"
            style={{ "--i": 17, "--j": 0 } as React.CSSProperties}
          >
            Sign Up
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signupMutation.mutate(signupData);
            }}
          >
            <div
              className="input-box animation"
              style={{ "--i": 18, "--j": 1 } as React.CSSProperties}
            >
              <input
                type="text"
                required
                onChange={(e) =>
                  setSignupData({ ...signupData, name: e.target.value })
                }
              />
              <label>Full Name 👤</label>
            </div>
            <div
              className="input-box animation"
              style={{ "--i": 19, "--j": 2 } as React.CSSProperties}
            >
              <input
                type="text"
                required
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
              />
              <label>Email 📧</label>
            </div>
            <div
              className="input-box animation"
              style={{ "--i": 20, "--j": 3 } as React.CSSProperties}
            >
              <input
                type="password"
                required
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
              />
              <label>Password 🔒</label>
            </div>
            <button
              type="submit"
              className="btn animation"
              style={{ "--i": 21, "--j": 4 } as React.CSSProperties}
            >
              {signupMutation.isPending ? "Creating..." : "Sign Up"}
            </button>
            <div
              className="logreg-link animation"
              style={{ "--i": 22, "--j": 5 } as React.CSSProperties}
            >
              <p>
                Already have an account?{" "}
                <span className="login-link" onClick={showLogin}>
                  Login
                </span>
              </p>
            </div>
          </form>
        </div>

        {/* ───── REGISTER INFO ───── */}
        <div className="info-text register">
          <h2
            className="animation"
            style={{ "--i": 17, "--j": 0 } as React.CSSProperties}
          >
            Hello Friend!
          </h2>
          <p
            className="animation"
            style={{ "--i": 18, "--j": 1 } as React.CSSProperties}
          >
            Create your account and start tracking your expenses smarter.
          </p>
        </div>
      </div>
    </div>
  );
}
