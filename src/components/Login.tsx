import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { LogIn, UserPlus } from 'lucide-react';
import { addUser, getUserByUsername } from '../services/db';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Login logic
      const user = await getUserByUsername(username);
      if (user && user.password === password) {
        setUser({
          id: user.id!,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          school: user.school,
          profilePicture: user.profilePicture,
        });
        navigate('/game');
      } else {
        alert('Invalid username or password');
      }
    } else {
      // Registration logic
      try {
        const userId = await addUser({
          username,
          password,
          firstName,
          lastName,
          school,
          profilePicture: profilePicture || undefined,
        });
        setUser({
          id: userId,
          username,
          firstName,
          lastName,
          school,
          profilePicture: profilePicture || undefined,
        });
        navigate('/game');
      } catch (error) {
        alert('Username already exists');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Multiplication Game</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
          required
        />
        {!isLogin && (
          <>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="School"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
          </>
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
        >
          {isLogin ? (
            <>
              <LogIn className="mr-2" size={20} />
              Login
            </>
          ) : (
            <>
              <UserPlus className="mr-2" size={20} />
              Register
            </>
          )}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-blue-500 hover:underline"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default Login;