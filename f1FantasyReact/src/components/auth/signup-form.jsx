import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [apiError, setApiError] = useState("");

  const onSubmit = async (formData) => {
    setApiError("");

    try {
      await apiRequest("/auth/signup", {
        method: "POST",
        body: formData,
      });

      navigate("/auth/login", { replace: true });
    } catch (err) {
      setApiError(err.message || "Signup failed");
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

        <input
          {...register("name", {
            required: "Name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
          })}
          placeholder="Name"
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.name ? (
          <p className="mb-2 text-sm text-red-600">{errors.name.message}</p>
        ) : null}

        <input
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email",
            },
          })}
          placeholder="Email"
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.email ? (
          <p className="mb-2 text-sm text-red-600">{errors.email.message}</p>
        ) : null}

        <input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
            validate: {
              hasUpper: (value) =>
                /[A-Z]/.test(value) || "Must include an uppercase letter",
              hasLower: (value) =>
                /[a-z]/.test(value) || "Must include a lowercase letter",
              hasNumber: (value) =>
                /[0-9]/.test(value) || "Must include a number",
              hasSpecial: (value) =>
                /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                "Must include a special character",
            },
          })}
          placeholder="Password"
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {errors.password ? (
          <p className="mb-2 text-sm text-red-600">
            {errors.password.message}
          </p>
        ) : null}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          Sign Up
        </button>

        {apiError ? <p className="mt-2 text-sm text-red-600">{apiError}</p> : null}

        <Link
          to="/auth/login"
          className="mt-4 block text-center text-sm text-green-600 hover:underline"
        >
          Already have an account? Log in
        </Link>
      </form>
    </div>
  );
};

export default Signup;
