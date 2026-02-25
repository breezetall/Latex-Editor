import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Register() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth(); 
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return; 
    }
    
    setIsSubmitting(true);
    const result = await register(username, password);
    
    if (result.success) {
      navigate("/login", { state: { message: "Account created! Please log in." } });
    } else {
      setError(result.message || "Account could not be registered");
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleRegister} className="w-full max-w-xs p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-center font-semibold text-lg mb-4">Create new account</h3>

        <label className="block text-sm mb-1 text-gray-600">Email/Username</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-3 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
        />

        <label className="block text-sm mb-1 text-gray-600">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-3 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
        />

        <label className="block text-sm mb-1 text-gray-600">Retype password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        {error && (
          <div className="text-red-600 text-sm mt-3 text-center">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}