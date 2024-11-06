import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { loginUser, registerUser } from '../firebase/utils';

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
      // Sprawdź rozmiar pliku (np. max 1MB)
      if (file.size > 1024 * 1024) {
        setPhotoError('Zdjęcie jest za duże. Maksymalny rozmiar to 1MB');
        return;
      }

      // Sprawdź typ pliku
      if (!file.type.startsWith('image/')) {
        setPhotoError('Proszę wybrać plik obrazu');
        return;
      }

      setPhotoFile(file);
      setPhotoError('');

      // Pokaż podgląd
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userData;
      if (isRegistering) {
        userData = await registerUser(username, password, firstName, lastName, photoFile || undefined);
      } else {
        userData = await loginUser(username, password);
      }
      setUser(userData);
      navigate('/game');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Gra Matematyczna</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nazwa użytkownika</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hasło</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        {isRegistering && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Imię</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nazwisko</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Avatar (opcjonalnie, max 1MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full p-2 border rounded"
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
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 disabled:bg-blue-300"
        >
          {loading ? 'Przetwarzanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
        </button>
      </form>

      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className="w-full text-blue-500 hover:text-blue-600"
      >
        {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
      </button>
    </div>
  );
};

export default Login;