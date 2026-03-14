import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, setStoredAuth } from "../../lib/api";

const Login = () => {
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
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: formData,
      });

      setStoredAuth(data);
      navigate("/fantasyTeams", { replace: true });
    } catch (err) {
      setApiError(err.message || "Login failed");
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

        <input
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email",
            },
          })}
          placeholder="Email"
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.email ? (
          <p className="mb-2 text-sm text-red-600">{errors.email.message}</p>
        ) : null}

        <input
          type="password"
          {...register("password", { required: "Password is required" })}
          placeholder="Password"
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.password ? (
          <p className="mb-2 text-sm text-red-600">
            {errors.password.message}
          </p>
        ) : null}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Login
        </button>

        {apiError ? <p className="mb-2 text-sm text-red-600">{apiError}</p> : null}

        <Link
          to="/auth/signup"
          className="mt-4 block text-center text-sm text-blue-600 hover:underline"
        >
          Don&apos;t have an account? Sign up
        </Link>
      </form>
    </div>
  );
};

export default Login;
