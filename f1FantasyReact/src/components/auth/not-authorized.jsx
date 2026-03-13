import React from "react";

const NotAuthorized = ({ roleNeeded }) => {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Not Authorized</h1>
      <p>You need to be a {roleNeeded} to view this page</p>
    </div>
  );
};

export default NotAuthorized;
