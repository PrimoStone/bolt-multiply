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
        // Pokaż oryginalny rozmiar
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        console.log(`Oryginalny rozmiar: ${originalSize}MB`);

        // Kompresuj i pokaż podgląd
        const compressedFile = await compressImage(file);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`Skompresowany rozmiar: ${compressedSize}MB`);

        setPhotoFile(compressedFile);
        setPhotoError('');

        // Pokaż podgląd
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        setPhotoError('Błąd podczas przetwarzania zdjęcia');
        console.error(error);
      }
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
    <div className="min-h-screen h-screen bg-gradient-to-b from-orange-100 to-orange-200 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 h-full relative flex flex-col">
        {/* Header z logo */}
        <div className="pt-4 pb-4 text-center">
          <img 
            src="/number-ninjas-logo.png"
            alt="Number Ninjas"
            className="w-24 h-auto mx-auto"
          />
        </div>

        {/* Formularz logowania - zachowujemy oryginalną logikę */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
            {/* Tutaj istniejący formularz */}
            <form onSubmit={handleSubmit}>
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
                      Avatar (zostanie automatycznie zmniejszony)
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
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Zdjęcie zostanie automatycznie zoptymalizowane
                        </p>
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

            {/* Zamień sekcję z linkiem na przełącznik */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isRegistering 
                  ? 'Masz już konto? Zaloguj się' 
                  : 'Nie masz jeszcze konta? Zarejestruj się'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer z logo */}
        <div className="py-4 text-center">
          <img 
            src="/MrPrimo-LOGO-sm.png"
            alt="MrPrimo"
            className="w-16 h-auto mx-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;