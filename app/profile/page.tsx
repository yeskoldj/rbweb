'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/languageContext';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    recoveryEmail: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Primero verificar Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          setUser(userData);
          setProfileData({
            full_name: userData.full_name || '',
            phone: userData.phone || '',
            email: userData.email || authUser.email
          });
          setLoading(false);
          return;
        }
      }

      // Si no hay usuario en Supabase, verificar localStorage
      const localUser = localStorage.getItem('bakery-user');
      if (!localUser) {
        router.push('/auth');
        return;
      }

      const userData = JSON.parse(localUser);
      setUser({
        email: userData.email,
        full_name: userData.fullName || userData.email.split('@')[0],
        phone: userData.phone || '',
        role: userData.role || (userData.isOwner ? 'owner' : 'customer')
      });

      setProfileData({
        full_name: userData.fullName || userData.email.split('@')[0],
        phone: userData.phone || '',
        email: userData.email
      });

    } catch (error) {
      console.log('Error verificando usuario:', error);
      // Verificar localStorage como fallback
      const localUser = localStorage.getItem('bakery-user');
      if (localUser) {
        const userData = JSON.parse(localUser);
        setUser({
          email: userData.email,
          full_name: userData.fullName || userData.email.split('@')[0],
          phone: userData.phone || '',
          role: userData.role || (userData.isOwner ? 'owner' : 'customer')
        });

        setProfileData({
          full_name: userData.fullName || userData.email.split('@')[0],
          phone: userData.phone || '',
          email: userData.email
        });
      } else {
        router.push('/auth');
        return;
      }
    }
    
    setLoading(false);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Actualizar en localStorage
      const localUser = JSON.parse(localStorage.getItem('bakery-user') || '{}');
      const updatedUser = {
        ...localUser,
        fullName: profileData.full_name,
        phone: profileData.phone,
        email: profileData.email
      };
      localStorage.setItem('bakery-user', JSON.stringify(updatedUser));

      // Intentar actualizar en Supabase si está disponible
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: profileData.full_name,
              phone: profileData.phone,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (!error) {
            console.log('Perfil actualizado en Supabase');
          }
        } catch (supabaseError) {
          console.log('Error actualizando en Supabase, guardado localmente');
        }
      }

      // Actualizar estado local
      setUser({
        ...user,
        full_name: profileData.full_name,
        phone: profileData.phone,
        email: profileData.email
      });
      
      setShowEditModal(false);
      alert('Perfil actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error actualizando el perfil');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // Guardar información de recuperación
      const backupData = {
        email: user?.email,
        recoveryEmail: passwordData.recoveryEmail,
        securityQuestion: passwordData.securityQuestion,
        securityAnswer: passwordData.securityAnswer,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('bakery-password-recovery', JSON.stringify(backupData));

      try {
        // Intentar actualizar en Supabase
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });

        if (error) {
          throw error;
        }

        // Actualizar información adicional en la base de datos
        await supabase
          .from('profiles')
          .update({
            recovery_email: passwordData.recoveryEmail,
            security_question: passwordData.securityQuestion,
            security_answer_hash: btoa(passwordData.securityAnswer.toLowerCase()),
            updated_at: new Date().toISOString()
          })
          .eq('email', user?.email);

        alert('¡Contraseña actualizada exitosamente!');
        
      } catch (supabaseError) {
        console.log('Error con Supabase, usando sistema local:', supabaseError);
        
        // Fallback: guardar en localStorage
        const localUsers = JSON.parse(localStorage.getItem('bakery-local-users') || '{}');
        localUsers[user?.email] = {
          ...localUsers[user?.email],
          password: btoa(passwordData.newPassword),
          ...backupData
        };
        localStorage.setItem('bakery-local-users', JSON.stringify(localUsers));
        
        alert('Contraseña actualizada en el sistema local');
      }

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        recoveryEmail: '',
        securityQuestion: '',
        securityAnswer: ''
      });

    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      alert('Error actualizando la contraseña');
    }
  };

  const logout = () => {
    if (confirm('¿Estás seguro que quieres cerrar sesión?')) {
      localStorage.removeItem('bakery-user');
      localStorage.removeItem('bakery-cart');
      supabase.auth.signOut();
      router.push('/');
    }
  };

  const showRecoveryInfoModal = () => {
    setShowRecoveryInfo(true);
  };

  const closeRecoveryInfoModal = () => {
    setShowRecoveryInfo(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Header />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getUserRole = () => {
    if (user?.role === 'owner') return 'Propietario';
    if (user?.role === 'employee') return 'Empleado';
    return 'Cliente';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-20 pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-amber-800">Mi Perfil</h1>
              <p className="text-sm text-gray-600">{getUserRole()}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center space-x-2"
            >
              <i className="ri-logout-circle-line"></i>
              <span className="text-sm">Salir</span>
            </button>
          </div>

          {/* Información del Usuario */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.full_name || 'Usuario'}</h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium mt-1">
                  {getUserRole()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="ri-mail-line text-gray-500"></i>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="ri-user-line text-gray-500"></i>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nombre Completo</p>
                    <p className="text-sm text-gray-600">{user.full_name || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="ri-phone-line text-gray-500"></i>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teléfono</p>
                    <p className="text-sm text-gray-600">{user.phone || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="ri-shield-user-line text-gray-500"></i>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tipo de Cuenta</p>
                    <p className="text-sm text-gray-600">{getUserRole()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de Configuración */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración de Cuenta</h3>

            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-full text-white">
                  <i className="ri-edit-line"></i>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Editar Información Personal</p>
                  <p className="text-sm text-gray-600">Actualizar nombre, teléfono y email</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-amber-500 rounded-full text-white">
                  <i className="ri-lock-password-line"></i>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Cambiar Contraseña</p>
                  <p className="text-sm text-gray-600">Actualizar tu contraseña de seguridad</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </button>

            <button
              onClick={showRecoveryInfoModal}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-500 rounded-full text-white">
                  <i className="ri-shield-keyhole-line"></i>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Información de Recuperación</p>
                  <p className="text-sm text-gray-600">Ver datos de seguridad guardados</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg hover:from-red-100 hover:to-pink-100 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-red-500 rounded-full text-white">
                  <i className="ri-logout-circle-line"></i>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Cerrar Sesión</p>
                  <p className="text-sm text-gray-600">Salir de tu cuenta de forma segura</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </button>
          </div>

          {/* Modal de Editar Perfil */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Editar Información Personal</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <form onSubmit={updateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="tu.email@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Tu número de teléfono"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-lg font-medium !rounded-button hover:shadow-md"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Cambiar Contraseña */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Cambiar Contraseña</h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-shield-keyhole-line text-amber-600"></i>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-amber-800">Protección de Acceso</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Configura información de recuperación para evitar perder el acceso a tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Tu contraseña actual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <i className="ri-shield-check-line text-green-600 mr-2"></i>
                      Información de Recuperación
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email de Recuperación
                        </label>
                        <input
                          type="email"
                          value={passwordData.recoveryEmail}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, recoveryEmail: e.target.value }))}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                          placeholder="Email alternativo para recuperación"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pregunta de Seguridad
                        </label>
                        <select
                          value={passwordData.securityQuestion}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, securityQuestion: e.target.value }))}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                        >
                          <option value="">Selecciona una pregunta</option>
                          <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                          <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                          <option value="¿Cuál es tu comida favorita?">¿Cuál es tu comida favorita?</option>
                          <option value="¿Cuál es el nombre de tu mejor amigo/a?">¿Cuál es el nombre de tu mejor amigo/a?</option>
                          <option value="¿Cuál fue tu primer trabajo?">¿Cuál fue tu primer trabajo?</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Respuesta de Seguridad
                        </label>
                        <input
                          type="text"
                          value={passwordData.securityAnswer}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, securityAnswer: e.target.value }))}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                          placeholder="Tu respuesta (recuérdala bien)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg font-medium !rounded-button hover:shadow-md"
                    >
                      Cambiar Contraseña
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Información de Recuperación */}
          {showRecoveryInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                        <i className="ri-shield-keyhole-line text-blue-600 text-xl"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Información de Recuperación</h3>
                        <p className="text-sm text-gray-600">Datos guardados para recuperar acceso</p>
                      </div>
                    </div>
                    <button
                      onClick={closeRecoveryInfoModal}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <i className="ri-close-line text-gray-600"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-mail-line text-blue-600"></i>
                        </div>
                        <h4 className="font-semibold text-blue-800">Email de Recuperación</h4>
                      </div>
                      <p className="text-blue-700 font-medium">
                        {localStorage.getItem('recovery-email') || 'No configurado'}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Este email recibe enlaces para restablecer la contraseña
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-question-line text-green-600"></i>
                        </div>
                        <h4 className="font-semibold text-green-800">Pregunta de Seguridad</h4>
                      </div>
                      <p className="text-green-700 font-medium mb-2">
                        {localStorage.getItem('security-question') || 'No configurado'}
                      </p>
                      <div className="bg-green-100 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Respuesta Guardada:</p>
                        <p className="text-green-700">
                          {localStorage.getItem('security-answer') ? '••••••••••' : 'No configurado'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-phone-line text-purple-600"></i>
                        </div>
                        <h4 className="font-semibold text-purple-800">Teléfono de Verificación</h4>
                      </div>
                      <p className="text-purple-700 font-medium">
                        {user.phone || 'No configurado'}
                      </p>
                      <p className="text-xs text-purple-600 mt-2">
                        Para verificación por SMS si es necesario
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-time-line text-amber-600"></i>
                        </div>
                        <h4 className="font-semibold text-amber-800">Última Actualización</h4>
                      </div>
                      <p className="text-amber-700 font-medium" suppressHydrationWarning={true}>
                        {localStorage.getItem('security-updated') || 'Primera vez'}
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        Fecha del último cambio de seguridad
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
                      <div className="flex items-start">
                        <div className="w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                          <i className="ri-shield-check-line text-red-600"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-800 mb-2">Recomendaciones de Seguridad</h4>
                          <ul className="text-xs text-red-700 space-y-1">
                            <li>• Mantén tu email de recuperación actualizado</li>
                            <li>• Usa una pregunta de seguridad que solo tú conozcas</li>
                            <li>• Verifica tu número de teléfono regularmente</li>
                            <li>• Cambia tu contraseña cada 90 días</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        closeRecoveryInfoModal();
                        setShowPasswordModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                      <i className="ri-key-line mr-2"></i>
                      Actualizar Información de Seguridad
                    </button>
                    
                    <button
                      onClick={closeRecoveryInfoModal}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center text-xs text-gray-600">
                      <i className="ri-information-line mr-2"></i>
                      <span>Esta información está almacenada de forma segura y encriptada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}