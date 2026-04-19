import { Link } from "react-router-dom";

const NotAuthorized = ({ roleNeeded }) => {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold text-red-600">Not Authorized</h1>
      <p className="mb-4 text-slate-700">
        You need to be a {roleNeeded} to view this page.
      </p>
      <Link
        to="/fantasyTeams"
        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Back to app
      </Link>
    </div>
  );
};

export default NotAuthorized;
