
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../lib/languageContext';
import { supabase } from '../../lib/supabase';
import { saveUser } from '../../lib/authStorage';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const router = useRouter();
  const { t } = useLanguage();

  const ownerEmails = [
    'yskmem@pm.me','yeskoldj@gmail.com','rangerbakery@gmail.com',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Normalizar email a minúsculas SIEMPRE para consistencia
      const normalizedEmail = formData.email.toLowerCase().trim();
      
      if (isLogin) {
        console.log('🔐 Intentando login con email:', normalizedEmail);
        
        // Intentar login con Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: formData.password, // Contraseña SÍ es case-sensitive
        });

        if (error) {
          console.error('❌ Error de Supabase Auth:', error.message);
          
          // Mejorar mensajes de error específicos
          if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
            setError('Email o contraseña incorrectos. Verifica tus datos.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
          } else if (error.message.includes('Too many requests')) {
            setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
          } else {
            setError('Error al iniciar sesión. Verifica tu conexión e intenta nuevamente.');
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          console.log('✅ Login exitoso para usuario:', data.user.id);
          
          // Verificar que el usuario existe en la tabla profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('⚠️ Error al obtener perfil (puede ser normal):', profileError);
          }

          // Determinar rol y permisos
          const isOwner = ownerEmails.includes(normalizedEmail);
          const userRole = profile?.role || (isOwner ? 'owner' : 'customer');

          const userData = {
            id: data.user.id,
            email: normalizedEmail, // Usar email normalizado
            fullName: profile?.full_name || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
            isOwner: isOwner,
            role: userRole,
            loginTime: Date.now()
          };

          // Guardar usuario sanitisado en localStorage con expiración
          saveUser(userData);

          console.log('👤 Usuario autenticado:', userData);

          // Redirigir según el rol
          if (isOwner || userRole === 'owner' || userRole === 'employee') {
            router.push('/dashboard');
          } else {
            router.push('/');
          }
        }
      } else {
        // REGISTRO
        console.log('📝 Intentando registro con email:', normalizedEmail);
        
        // Validar formato de email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(normalizedEmail)) {
          setError('Por favor ingresa un email válido.');
          setLoading(false);
          return;
        }

        // Validar contraseña
        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        // Validar nombre completo
        if (formData.fullName.trim().length < 2) {
          setError('Por favor ingresa tu nombre completo.');
          setLoading(false);
          return;
        }

        // Registro con Supabase
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: formData.password, // Contraseña original (case-sensitive)
          options: {
            data: {
              full_name: formData.fullName.trim(),
            }
          }
        });

        if (error) {
          console.error('❌ Error en registro:', error.message);
          
          if (error.message.includes('User already registered')) {
            setError('Este email ya está registrado. Intenta iniciar sesión.');
          } else if (error.message.includes('Password should be at least 6 characters')) {
            setError('La contraseña debe tener al menos 6 caracteres.');
          } else if (error.message.includes('Unable to validate email address')) {
            setError('Email inválido. Verifica el formato.');
          } else if (error.message.includes('Signup is disabled')) {
            setError('El registro está temporalmente deshabilitado. Contacta al administrador.');
          } else {
            setError('Error al crear la cuenta. Intenta nuevamente.');
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          console.log('✅ Registro exitoso para usuario:', data.user.id);
          
          // Determinar rol automáticamente
          const isOwner = ownerEmails.includes(normalizedEmail);
          const userRole = isOwner ? 'owner' : 'customer';
          
          // Crear perfil en la tabla profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.user.id,
                email: normalizedEmail, // Email normalizado
                full_name: formData.fullName.trim(),
                role: userRole,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ], {
              onConflict: 'id'
            });

          if (profileError) {
            console.warn('⚠️ Error creando perfil (puede ser normal si ya existe):', profileError);
          }

          setError('');
          setSuccess('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta, luego puedes iniciar sesión.');
          
          // Limpiar formulario
          setFormData({ email: '', password: '', fullName: '' });
          
          // Cambiar a modo login después de 3 segundos
          setTimeout(() => {
            setIsLogin(true);
            setSuccess('');
          }, 3000);
        }
      }
    } catch (err: any) {
      console.error('💥 Error crítico en autenticación:', err);
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
    }
    
    setLoading(false);
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-error-warning-line text-red-600 text-sm"></i>
                  </div>
                  <p className="ml-2 text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-check-line text-green-600 text-sm"></i>
                  </div>
                  <p className="ml-2 text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

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
                  placeholder="tu.email@ejemplo.com"
                  autoComplete="email"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">El email no distingue mayúsculas/minúsculas</p>
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
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">La contraseña SÍ distingue mayúsculas/minúsculas</p>
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
                    minLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    placeholder="Tu nombre completo"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-400 to-teal-400 text-white py-3 rounded-lg font-medium !rounded-button disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </div>
                ) : (
                  isLogin ? t('loginButton') : t('signupButton')
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                  setFormData({ email: '', password: '', fullName: '' });
                }}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                disabled={loading}
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
                  <li>• {t('addToCart')}</li>
                  <li>• {t('placeOrders')}</li>
                  <li>• {t('orderHistory')}</li>
                  <li>• {t('emailConfirmations')}</li>
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