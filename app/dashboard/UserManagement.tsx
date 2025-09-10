
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/languageContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    recoveryEmail: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const { t } = useLanguage();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const localUser = localStorage.getItem('bakery-user');
      if (localUser) {
        const userData = JSON.parse(localUser);
        setCurrentUser({ 
          role: userData.isOwner ? 'owner' : 'customer',
          email: userData.email,
          full_name: userData.fullName || userData.email.split('@')[0],
          phone: userData.phone || ''
        });
        setProfileData({
          full_name: userData.fullName || userData.email.split('@')[0],
          phone: userData.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        if (userData.isOwner || userData.email === 'yskmem@pm.me') {
          await loadUsersFromDatabase();
        }
        setLoading(false);
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        return;
      }

      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('No se pudo cargar el perfil, usando datos por defecto');
        setLoading(false);
        return;
      }

      setCurrentUser(userData);
      setProfileData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      if (userData?.role === 'owner' || userData?.role === 'employee') {
        await loadUsersFromDatabase();
      }
    } catch (error) {
      console.log('Error en la autenticación, usando modo local');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersFromDatabase = async () => {
    try {
      // Primero intentar cargar desde Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error al cargar usuarios:', error);
        setErrorMessage('No se pudieron cargar los usuarios. Revisa la consola para más detalles.');
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No se encontraron usuarios en la base de datos');
        setErrorMessage('No se encontraron usuarios en la base de datos.');
        setUsers([]);
        return;
      }

      const cleanedUsers = (data as User[]).map((user) => ({
        ...user,
        full_name: user.full_name || user.email.split('@')[0],
        role: user.role || 'customer'
      }));

      setUsers(cleanedUsers);
      
    } catch (error) {
      console.error('Error de conexión al cargar usuarios:', error);
      setErrorMessage('Error de conexión al cargar usuarios.');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error actualizando usuario:', error);
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        );
        setUsers(updatedUsers);
        alert(`Usuario actualizado a ${newRole}`);
        return;
      }

      alert(`Usuario actualizado a ${newRole} exitosamente`);
      await loadUsersFromDatabase(); 
    } catch (error) {
      console.error('Error:', error);
      alert('Error actualizando el usuario');
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert(t('passwordsMismatch'));
      return;
    }

    try {
      const localUser = JSON.parse(localStorage.getItem('bakery-user') || '{}');
      const updatedUser = {
        ...localUser,
        fullName: profileData.full_name,
        phone: profileData.phone
      };
      localStorage.setItem('bakery-user', JSON.stringify(updatedUser));

      if (currentUser?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: profileData.full_name,
              phone: profileData.phone,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

          if (error) {
            console.log('Error actualizando en Supabase:', error);
            alert(t('profileUpdated'));
          } else {
            alert(t('profileUpdated'));
          }

          if (profileData.newPassword) {
            const { error: passwordError } = await supabase.auth.updateUser({
              password: profileData.newPassword
            });

            if (passwordError) {
              console.log('Error actualizando contraseña:', passwordError);
            }
          }
        } catch (supabaseError) {
          console.log('Supabase no disponible, guardado localmente');
          alert(t('profileUpdated'));
        }
      } else {
        alert(t('profileUpdated'));
      }

      setCurrentUser({
        ...currentUser,
        full_name: profileData.full_name,
        phone: profileData.phone
      });
      
      setShowProfileModal(false);
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert(t('profileError'));
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
      const backupData = {
        email: currentUser?.email,
        recoveryEmail: passwordData.recoveryEmail,
        securityQuestion: passwordData.securityQuestion,
        securityAnswer: passwordData.securityAnswer,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('bakery-password-recovery', JSON.stringify(backupData));

      try {
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });

        if (error) {
          throw error;
        }

        await supabase
          .from('profiles')
          .update({
            recovery_email: passwordData.recoveryEmail,
            security_question: passwordData.securityQuestion,
            security_answer_hash: btoa(passwordData.securityAnswer.toLowerCase()),
            updated_at: new Date().toISOString()
          })
          .eq('email', currentUser?.email);

        alert('¡Contraseña actualizada exitosamente! Tu información de recuperación ha sido guardada.');
        
      } catch (supabaseError) {
        console.log('Error con Supabase, usando sistema local:', supabaseError);
        
        const localUsers = JSON.parse(localStorage.getItem('bakery-local-users') || '{}');
        localUsers[currentUser?.email] = {
          ...localUsers[currentUser?.email],
          password: btoa(passwordData.newPassword),
          ...backupData
        };
        localStorage.setItem('bakery-local-users', JSON.stringify(localUsers));
        
        alert('Contraseña actualizada en el sistema local. Tu información de recuperación ha sido guardada.');
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
      alert('Error actualizando la contraseña. Inténtalo de nuevo.');
    }
  };

  const sendNotificationEmail = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: 'rangerbakery@gmail.com',
          type: 'order_confirmation',
          language: 'es',
          orderData: {
            id: 'TEST-' + Date.now(),
            status: 'confirmed',
            customer_name: currentUser?.full_name || 'Cliente de Prueba',
            customer_phone: currentUser?.phone || '809-123-4567',
            customer_email: currentUser?.email || 'test@example.com',
            items: [
              { name: 'Tres Leches', quantity: 1, price: 25.00 },
              { name: 'Flan', quantity: 2, price: 15.00 }
            ],
            subtotal: 55.00,
            tax: 5.50,
            total: 60.50,
            pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
            special_requests: 'Email de prueba del sistema de notificaciones'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('¡Email de prueba enviado exitosamente a rangerbakery@gmail.com!');
      } else {
        alert('Error enviando email: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error enviando email de prueba. Verifica la configuración de Supabase Edge Functions.');
    }
  };

  const showRecoveryInfo = () => {
    const recoveryData = localStorage.getItem('bakery-password-recovery');
    if (recoveryData) {
      const data = JSON.parse(recoveryData);
      alert(`Información de recuperación guardada:
      
Email de recuperación: ${data.recoveryEmail}
Pregunta de seguridad: ${data.securityQuestion}
Guardado el: ${new Date(data.timestamp).toLocaleString()}

Esta información te permitirá recuperar el acceso si olvidas tu contraseña.`);
    } else {
      alert('No hay información de recuperación guardada. Te recomendamos configurar un método de recuperación.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 mt-2">{t('loading')}</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-center py-8 text-red-600">
        {errorMessage}
      </div>
    );
  }

  const pendingUsers = users.filter(user => user.role === 'pending');
  const employees = users.filter(user => user.role === 'employee');
  const customers = users.filter(user => user.role === 'customer');
  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-amber-800">
          {isOwner ? 'Gestión de Usuarios' : 'Mi Perfil'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={showRecoveryInfo}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 flex items-center space-x-2"
            title="Ver información de recuperación"
          >
            <i className="ri-shield-keyhole-line"></i>
            <span className="text-sm">Recuperación</span>
          </button>
          {isOwner && (
            <button
              onClick={sendNotificationEmail}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 flex items-center space-x-2"
              title="Probar notificación por email"
            >
              <i className="ri-mail-send-line"></i>
              <span className="text-sm">Test Email</span>
            </button>
          )}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 flex items-center space-x-2"
            title="Cambiar contraseña"
          >
            <i className="ri-lock-password-line"></i>
            <span className="text-sm">Contraseña</span>
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium hover:bg-pink-200 flex items-center space-x-2"
          >
            <i className="ri-settings-line"></i>
            <span className="text-sm">Configurar</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">
              {currentUser?.full_name || 'Usuario'} • {currentUser?.role === 'owner' ? 'Propietario' : currentUser?.role === 'employee' ? 'Empleado' : 'Cliente'}
            </p>
            <p className="text-xs text-blue-600">{currentUser?.email}</p>
          </div>
          {isOwner && (
            <div className="text-right">
              <p className="text-sm font-medium text-blue-800">{users.length} usuarios en sistema</p>
            </div>
          )}
        </div>
      </div>

      {!isOwner ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-5 h-5 flex items-center justify-center mr-2">
              <i className="ri-user-line text-gray-600"></i>
            </div>
            Mi Información Personal
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Nombre Completo</p>
                  <p className="font-medium text-gray-900">{currentUser?.full_name || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-600">{currentUser?.email}</p>
                </div>
                {currentUser?.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm text-gray-600">{currentUser.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Tipo de Cuenta</p>
                  <p className="text-sm text-gray-600">
                    {currentUser?.role === 'owner' ? 'Propietario' : currentUser?.role === 'employee' ? 'Empleado' : 'Cliente'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-4 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-lg font-medium !rounded-button hover:shadow-md flex items-center justify-center space-x-2"
              >
                <i className="ri-edit-line"></i>
                <span>Editar Perfil</span>
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg font-medium !rounded-button hover:shadow-md flex items-center justify-center space-x-2"
              >
                <i className="ri-lock-password-line"></i>
                <span>Cambiar Clave</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {pendingUsers.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <i className="ri-time-line text-yellow-600"></i>
                </div>
                Solicitudes Pendientes ({pendingUsers.length})
              </h3>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                        <p className="text-xs text-gray-500">
                          Solicitado: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateUserRole(user.id, 'employee')}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded-full !rounded-button hover:bg-green-600"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => updateUserRole(user.id, 'customer')}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-full !rounded-button hover:bg-red-600"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-5 h-5 flex items-center justify-center mr-2">
                <i className="ri-user-settings-line text-gray-600"></i>
              </div>
              Empleados ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay empleados registrados</p>
            ) : (
              <div className="space-y-3">
                {employees.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Empleado
                      </span>
                      <button
                        onClick={() => updateUserRole(user.id, 'customer')}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Remover acceso
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-5 h-5 flex items-center justify-center mr-2">
                <i className="ri-user-line text-gray-600"></i>
              </div>
              Clientes ({customers.length})
            </h3>
            {customers.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay clientes registrados</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      {user.phone && <p className="text-xs text-gray-600">{user.phone}</p>}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Cliente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">{t('myProfile')}</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fullName')}
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
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                  placeholder="Tu número de teléfono"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-3">{t('changePassword')}</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('currentPassword')}
                    </label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('newPassword')}
                    </label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('confirmPassword')}
                    </label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-lg font-medium !rounded-button hover:shadow-md"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
