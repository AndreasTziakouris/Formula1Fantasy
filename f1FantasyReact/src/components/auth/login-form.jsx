import React, { useState } from "react";
import { useForm } from "react-hook-form";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [apiError, setApiError] = useState("");
  const onSubmit = async (formData) => {
    setApiError("");
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userRole", data.role);
      window.location.href = "/fantasyTeams";
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md"
      >
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Log in
        </h2>

        {/* Email */}
        <input
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email",
            },
          })}
          placeholder="Email"
          className="mb-4 w-full rounded-lg border text-gray-900 border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mb-2 text-sm text-red-600">{errors.email.message}</p>
        )}

        {/* Password */}
        <input
          type="password"
          {...register("password", { required: "Password is required" })}
          placeholder="Password"
          className="mb-4 w-full rounded-lg border text-gray-900 border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mb-2 text-sm text-red-600">{errors.password.message}</p>
        )}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Login
        </button>

        {apiError && <p className="mb-2 text-sm text-red-600">{apiError}</p>}

        <a
          href="/auth/signup"
          className="mt-4 block text-center text-sm text-blue-600 hover:underline"
        >
          Don&apos;t have an account? Sign up
        </a>
      </form>
    </div>
  );
};

export default Login;
