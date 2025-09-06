
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../lib/languageContext';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const router = useRouter();
  const { t } = useLanguage();

  /* 
  🔑 CAMBIAR PERMISOS DE OWNER:
  Modifica esta lista para agregar más emails con permisos de propietario
  */
  const ownerEmails = [
    'yskmem@pm.me',
    // 'tu-email@ejemplo.com',  // 🔑 DESCOMENTA ESTA LÍNEA Y REEMPLAZA CON TU EMAIL PARA SER OWNER
    // 'otro-owner@ejemplo.com' // 🔑 PUEDES AGREGAR MÁS EMAILS DE OWNERS AQUÍ
    
    // EJEMPLO DE COMO AGREGAR TU EMAIL:
    // 'mi-email@gmail.com',    // ← Descomenta y pon tu email real aquí
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        const userData = {
          email: formData.email,
          isOwner: ownerEmails.includes(formData.email), // Verifica si está en la lista de owners
          loginTime: Date.now()
        };
        localStorage.setItem('bakery-user', JSON.stringify(userData));

        // Si es owner, va al dashboard, si no, a la página principal
        if (ownerEmails.includes(formData.email)) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } else {
        const userData = {
          email: formData.email,
          fullName: formData.fullName,
          isOwner: false,
          loginTime: Date.now()
        };
        localStorage.setItem('bakery-user', JSON.stringify(userData));
        alert('Account created successfully! You can now login.');
        setIsLogin(true);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-20 pb-20">
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-amber-800 mb-2">
                {isLogin ? t('login') : t('signup')}
              </h1>
              <p className="text-gray-600 text-sm">
                {isLogin ? t('welcomeBack') : t('joinBakery')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Enter your password"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    placeholder="Your full name"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium !rounded-button disabled:opacity-50"
              >
                {loading ? t('pleaseWait') : (isLogin ? t('loginButton') : t('signupButton'))}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium"
              >
                {isLogin ? t('noAccount') : t('hasAccount')}
              </button>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-information-line text-amber-600 text-sm"></i>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">{t('whyAccount')}</h4>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  <li>{t('addToCart')}</li>
                  <li>{t('placeOrders')}</li>
                  <li>{t('orderHistory')}</li>
                  <li>{t('emailConfirmations')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
