import React, { useState, useEffect } from 'react';
import { useAuth, useData, useSettings } from '../App';
import type { User, UserRole } from '../types';
import { formatFullName } from './common/formatters';

const LoginScreen: React.FC = () => {
  const [role, setRole] = useState<UserRole>('student');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { login } = useAuth();
  const { students, teachers, admins } = useData();
  const { settings } = useSettings();
  const [usersForRole, setUsersForRole] = useState<User[]>([]);

  useEffect(() => {
    setSelectedUser('');
    let users: User[] = [];
    if (role === 'student') {
        users = students;
    } else if (role === 'teacher') {
        users = teachers;
    } else if (role === 'admin') {
        users = admins;
    }
    
    // Sort users by last name, then first name for consistency
    const sortedUsers = [...users].sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName, 'fa');
        if (lastNameComparison !== 0) {
            return lastNameComparison;
        }
        return a.firstName.localeCompare(b.firstName, 'fa');
    });

    setUsersForRole(sortedUsers);
  }, [role, students, teachers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      login(selectedUser, role);
    } else {
      alert('لطفا یک کاربر را انتخاب کنید.');
    }
  };
  
  const roleNames = {
    student: 'دانش‌آموز',
    teacher: 'معلم',
    admin: 'مدیریت',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-4">
            {settings.schoolLogoUrl && (
                <img src={settings.schoolLogoUrl} alt={settings.schoolName} className="mx-auto h-20 w-auto object-contain" />
            )}
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">ورود به {settings.schoolName}</h1>
                <p className="text-[var(--text-secondary)] mt-2">لطفا نقش و نام خود را انتخاب کنید</p>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-[var(--text-primary)] mb-1">نقش شما</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="student">دانش‌آموز</option>
              <option value="teacher">معلم</option>
              <option value="admin">مدیریت</option>
            </select>
          </div>

          <div>
            <label htmlFor="user" className="block text-sm font-medium text-[var(--text-primary)] mb-1">انتخاب کاربر</label>
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition"
              disabled={!role || usersForRole.length === 0}
               style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">-- به عنوان {roleNames[role]} وارد شوید --</option>
              {usersForRole.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatFullName(user)}
                  </option>
                ))
              }
              {usersForRole.length === 0 && (
                <option disabled>
                  {`هیچ ${roleNames[role]} یافت نشد.`}
                </option>
              )}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={!selectedUser}
              className="w-full bg-[var(--primary-600)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--primary-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)] transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ورود به پنل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
