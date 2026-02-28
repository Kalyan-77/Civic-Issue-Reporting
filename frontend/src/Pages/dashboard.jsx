import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch session data from backend
    axios
      .get(`${BASE_URL}/auth/users/session`, { 
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.loggedIn) {
          setUser(res.data.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${BASE_URL}/auth/users/logout`, {
        withCredentials: true,
      });
      // Redirect to login page after logout
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!user)
    return (
      <p className="text-center mt-10 text-red-500">
        You are not logged in. Please login first.
      </p>
    );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
      <p>
        <span className="font-semibold">Email:</span> {user.email}
      </p>
      <p>
        <span className="font-semibold">Role:</span> {user.role}
      </p>
      <p>
        <span className="font-semibold">User ID:</span> {user.id}
      </p>

      <button
        onClick={handleLogout}
        className="mt-6 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
