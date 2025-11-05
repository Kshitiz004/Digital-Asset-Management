'use client';

import { useEffect, useState } from 'react';
import { assetsAPI } from '@/lib/api';

/**
 * Asset List Component
 * Displays all assets with options to download, share, and delete
 */
interface AssetListProps {
  userRole?: string;
}

interface Asset {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  assetType: string;
  tags: string;
  description: string;
  createdAt: string;
  isShared: boolean;
}

const isViewer = (role?: string) => role === 'viewer';
const canModify = (role?: string) => role !== 'viewer';

export default function AssetList({ userRole }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editTags, setEditTags] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchAssets = async () => {
    try {
      setRefreshing(true);
      // Use admin endpoint if admin, otherwise user endpoint (which returns shared assets for viewers)
      const response =
        userRole === 'admin'
          ? await assetsAPI.getAllAssets()
          : await assetsAPI.getAll();
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssets();

    // Listen for asset uploads to refresh list
    const handleAssetsUpdated = () => {
      fetchAssets();
    };
    window.addEventListener('assets-updated', handleAssetsUpdated);

    return () => {
      window.removeEventListener('assets-updated', handleAssetsUpdated);
    };
  }, [userRole]);

  const handleView = async (asset: Asset) => {
    try {
      const response = await assetsAPI.getViewUrl(asset.id);
      const url = response.data;
      // Open in new tab for viewing
      window.open(url, '_blank');
    } catch (error: any) {
      alert(`Failed to view asset: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      const response = await assetsAPI.getDownloadUrl(asset.id);
      const url = response.data;
      
      // For S3 presigned URLs, we need to fetch and create blob to force download
      // This handles CORS and ensures files download instead of opening
      try {
        const fileResponse = await fetch(url, {
          method: 'GET',
          mode: 'cors',
        });
        
        if (!fileResponse.ok) {
          throw new Error(`HTTP error! status: ${fileResponse.status}`);
        }
        
        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = asset.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (fetchError) {
        // Fallback: try direct download with download attribute
        // For S3 URLs, this might open in new tab, but it's a fallback
        const link = document.createElement('a');
        link.href = url;
        link.download = asset.filename;
        link.target = '_blank'; // Open in new tab as fallback
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error: any) {
      alert(`Failed to download asset: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  const handleShare = async (asset: Asset) => {
    try {
      const response = await assetsAPI.share(asset.id);
      if (response.data.sharedUrl) {
        navigator.clipboard.writeText(response.data.sharedUrl);
        alert('Shared URL copied to clipboard!');
        fetchAssets(); // Refresh to update isShared status
      }
    } catch (error) {
      alert('Failed to share asset');
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.filename}?`)) {
      return;
    }

    try {
      await assetsAPI.delete(asset.id);
      fetchAssets(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to delete asset: ${errorMessage}`);
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditTags(asset.tags || '');
    setEditDescription(asset.description || '');
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    try {
      setUpdating(true);
      await assetsAPI.update(editingAsset.id, {
        tags: editTags.trim() || undefined,
        description: editDescription.trim() || undefined,
      });
      setEditingAsset(null);
      setEditTags('');
      setEditDescription('');
      fetchAssets(); // Refresh list
      alert('Asset metadata updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to update asset: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditTags('');
    setEditDescription('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-600">Loading assets...</div>
      </div>
    );
  }

  return (
      <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {isViewer(userRole) ? 'Shared Assets' : 'My Assets'}
        </h2>
        <button
          onClick={fetchAssets}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isViewer(userRole)
            ? 'No shared assets available yet.'
            : 'No assets uploaded yet. Start by uploading a file above.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {asset.filename}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {(asset.size / 1024).toFixed(2)} KB
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {asset.assetType}
                  </span>
                  {asset.isShared && (
                    <span className="inline-block ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Shared
                    </span>
                  )}
                </div>
              </div>

              {asset.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {asset.description}
                </p>
              )}
              {asset.tags && (
                <p className="text-xs text-gray-600 mb-2">
                  Tags: {asset.tags}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleView(asset)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(asset)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition"
                >
                  Download
                </button>
                {canModify(userRole) && !asset.isShared && (
                  <button
                    onClick={() => handleShare(asset)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                  >
                    Share
                  </button>
                )}
                {canModify(userRole) && (
                  <>
                    <button
                      onClick={() => handleEdit(asset)}
                      className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition"
                      title="Edit metadata"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Edit Asset Metadata
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {editingAsset.filename}
            </p>
            <form onSubmit={handleUpdateMetadata} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., vacation, summer, 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter asset description..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={updating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


