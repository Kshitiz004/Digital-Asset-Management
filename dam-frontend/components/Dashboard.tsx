'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AssetUpload from '@/components/AssetUpload';
import AssetList from '@/components/AssetList';
import Analytics from '@/components/Analytics';
import UserManagement from '@/components/UserManagement';
import { authAPI } from '@/lib/api';

/**
 * Dashboard Component - Main interface after login
 * Shows: Upload area, Asset list, Analytics
 */
export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'analytics' | 'users'>('assets');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Digital Asset Management
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {user?.name || 'User'}
            </span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              {user?.role || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 border-b border-gray-200">
            <button
            onClick={() => setActiveTab('assets')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'assets'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {isViewer ? 'Shared Assets' : 'My Assets'}
          </button>
          {!isViewer && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'analytics'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Analytics
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'users'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Users
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === 'assets' && !isViewer && <AssetUpload />}
          {activeTab === 'assets' && <AssetList userRole={user?.role} />}
          {activeTab === 'analytics' && <Analytics userRole={user?.role} />}
          {activeTab === 'users' && isAdmin && <UserManagement />}
        </div>
      </div>
    </div>
  );
}


