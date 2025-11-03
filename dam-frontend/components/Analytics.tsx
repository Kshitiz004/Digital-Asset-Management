'use client';

import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Analytics Component
 * Displays charts and statistics based on user role
 * - User: Personal analytics
 * - Admin: System-wide analytics
 */
interface AnalyticsProps {
  userRole?: string;
}

interface UserAnalytics {
  storageUsage: { total: number; totalMB: string };
  assetTypeDistribution: Array<{ type: string; count: number; totalSize: number }>;
  recentActivity: Array<{ type: string; date: string; filename: string }>;
  statistics: { totalAssets: number; totalUploads: number; totalDeletions: number };
}

interface AdminAnalytics {
  storageUsage: { total: number; totalGB: string };
  mostActiveUsers: Array<{ userId: string; userName: string; activityCount: number }>;
  uploads: { total: number };
  deletions: { total: number };
  assets: { total: number };
  users: { total: number };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics({ userRole }: AnalyticsProps) {
  const [userStats, setUserStats] = useState<UserAnalytics | null>(null);
  const [adminStats, setAdminStats] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (userRole === 'admin') {
          const response = await analyticsAPI.getAdmin();
          setAdminStats(response.data);
        } else {
          const response = await analyticsAPI.getUser();
          setUserStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userRole]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  // User Analytics View
  if (userRole !== 'admin' && userStats) {
    const assetTypeData = userStats.assetTypeDistribution.map(item => ({
      name: item.type,
      value: item.count,
    }));

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="text-blue-600 text-sm font-semibold mb-2">Storage Used</div>
            <div className="text-3xl font-bold text-blue-800">{userStats.storageUsage.totalMB} MB</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="text-green-600 text-sm font-semibold mb-2">Total Assets</div>
            <div className="text-3xl font-bold text-green-800">{userStats.statistics.totalAssets}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="text-purple-600 text-sm font-semibold mb-2">Total Uploads</div>
            <div className="text-3xl font-bold text-purple-800">{userStats.statistics.totalUploads}</div>
          </div>
        </div>

        {/* Asset Type Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Asset Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Action</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">File</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {userStats.recentActivity.slice(0, 10).map((activity, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        activity.type === 'upload' ? 'bg-green-100 text-green-700' :
                        activity.type === 'delete' ? 'bg-red-100 text-red-700' :
                        activity.type === 'view' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-700 truncate max-w-xs">
                      {activity.filename || 'N/A'}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Admin Analytics View
  if (userRole === 'admin' && adminStats) {
    const mostActiveUsersData = adminStats.mostActiveUsers.slice(0, 5);
    const overviewData = [
      { name: 'Uploads', value: adminStats.uploads.total },
      { name: 'Deletions', value: adminStats.deletions.total },
      { name: 'Assets', value: adminStats.assets.total },
      { name: 'Users', value: adminStats.users.total },
    ];

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="text-blue-600 text-sm font-semibold mb-2">Total Storage</div>
            <div className="text-3xl font-bold text-blue-800">{adminStats.storageUsage.totalGB} GB</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="text-green-600 text-sm font-semibold mb-2">Total Users</div>
            <div className="text-3xl font-bold text-green-800">{adminStats.users.total}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="text-purple-600 text-sm font-semibold mb-2">Total Uploads</div>
            <div className="text-3xl font-bold text-purple-800">{adminStats.uploads.total}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
            <div className="text-orange-600 text-sm font-semibold mb-2">Total Assets</div>
            <div className="text-3xl font-bold text-orange-800">{adminStats.assets.total}</div>
          </div>
        </div>

        {/* System Overview Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">System Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {mostActiveUsersData.map((user, idx) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">{user.userName}</div>
                  <div className="text-sm text-gray-500">{user.userId}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600">{user.activityCount}</div>
                  <div className="text-xs text-gray-500">activities</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>No analytics data available</div>;
}


