import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { loginUser, registerUser, compressImage } from '../firebase/utils';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        console.log(`Original size: ${originalSize}MB`);

        const compressedFile = await compressImage(file);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`Compressed size: ${compressedSize}MB`);

        setPhotoFile(compressedFile);
        setPhotoError('');

        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        setPhotoError('Error processing photo');
        console.error(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;

      if (isRegistering) {
        // Registration
        if (!username || !password || !firstName || !lastName) {
          throw new Error('All fields are required');
        }

        userData = await registerUser(
          username,
          password,
          firstName,
          lastName,
          photoFile || undefined
        );
      } else {
        // Login
        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        userData = await loginUser(username, password);
      }

      setUser(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-orange-200 flex flex-col justify-center items-center p-4">
      <div className="mb-8 w-full max-w-md flex justify-center">
        <img
          src="/number-ninjas-logo.png"
          alt="Number Ninjas"
          className="w-64 h-auto"
        />
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Avatar (will be automatically optimized)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full p-2 border rounded mt-1"
                />
                {photoError && (
                  <p className="text-red-500 text-sm mt-1">{photoError}</p>
                )}
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-full mx-auto"
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Photo will be automatically optimized
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 disabled:bg-blue-300 mt-4"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setUsername('');
              setPassword('');
              setFirstName('');
              setLastName('');
              setPhotoFile(null);
              setPhotoPreview('');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isRegistering
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;