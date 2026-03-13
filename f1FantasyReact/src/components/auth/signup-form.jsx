import React, { useState } from "react";
import { useForm } from "react-hook-form";

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [apiError, setApiError] = useState("");

  const onSubmit = async (formData) => {
    setApiError("");
    try {
      const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      window.location.href = "/auth/login"; // redirect after signup
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
          Create account
        </h2>

        {/* Name */}
        <input
          {...register("name", {
            required: "Name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
          })}
          placeholder="Name"
          className="mb-4 w-full rounded-lg border text-gray-900 border-gray-300 p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.name && (
          <p className="mb-2 text-sm text-red-600">{errors.name.message}</p>
        )}

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
          className="mb-4 w-full rounded-lg border text-gray-900 border-gray-300 p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.email && (
          <p className="mb-2 text-sm text-red-600">{errors.email.message}</p>
        )}

        {/* Password */}
        <input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
            validate: {
              hasUpper: (v) =>
                /[A-Z]/.test(v) || "Must include an uppercase letter",
              hasLower: (v) =>
                /[a-z]/.test(v) || "Must include a lowercase letter",
              hasNumber: (v) => /[0-9]/.test(v) || "Must include a number",
              hasSpecial: (v) =>
                /[!@#$%^&*(),.?":{}|<>]/.test(v) ||
                "Must include a special character",
            },
          })}
          placeholder="Password"
          className="mb-4 w-full rounded-lg border text-gray-900 border-gray-300 p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.password && (
          <p className="mb-2 text-sm text-red-600">{errors.password.message}</p>
        )}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          Sign Up
        </button>

        {apiError && <p className="mt-2 text-sm text-red-600">{apiError}</p>}

        <a
          href="/auth/login"
          className="mt-4 block text-center text-sm text-green-600 hover:underline"
        >
          Already have an account? Log in
        </a>
      </form>
    </div>
  );
};

export default Signup;
