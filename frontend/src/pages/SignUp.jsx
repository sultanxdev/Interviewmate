import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiUser, FiLoader, FiAlertCircle } from "react-icons/fi";

const SignUp = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#bef264] rounded-lg flex items-center justify-center font-bold text-black text-xl">
              i
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              interMate<span className="text-[#bef264]">.Ai</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Create your account</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Start practising interviews with AI today
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <FiAlertCircle className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                  <input
                    id="signup-firstname"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Last name
                </label>
                <input
                  id="signup-lastname"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)] mt-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
