'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Key, Plus, Eye, EyeOff, Trash2, CheckCircle, XCircle, X } from 'lucide-react'

interface ApiKey {
  id: string
  key_name: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  masked_key: string
}

export default function ApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyName, setNewKeyName] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [showKeyId, setShowKeyId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('instantly_credentials')
      .select('id, key_name, created_at, updated_at, is_active, api_key')
      .order('created_at', { ascending: false })

    if (data) {
      // Mask API keys for display
      const maskedKeys = data.map(key => ({
        ...key,
        masked_key: maskApiKey(key.api_key)
      }))
      setApiKeys(maskedKeys)
    }

    setLoading(false)
  }

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return '••••••••'
    return `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError('')

    const response = await fetch('/api/instantly/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: newKeyValue,
        key_name: newKeyName || null
      })
    })

    const data = await response.json()

    if (response.ok) {
      await fetchApiKeys()
      resetAddModal()
    } else {
      setAddError(data.error || 'Failed to add API key')
    }

    setAddLoading(false)
  }

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    const supabase = createClient()

    // Toggle the status of this specific key
    const { error } = await supabase
      .from('instantly_credentials')
      .update({ is_active: !currentStatus })
      .eq('id', keyId)

    if (!error) {
      await fetchApiKeys()
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('instantly_credentials')
      .delete()
      .eq('id', keyId)

    if (!error) {
      setDeleteConfirm(null)
      await fetchApiKeys()
    }
  }

  const resetAddModal = () => {
    setShowAddModal(false)
    setNewKeyValue('')
    setNewKeyName('')
    setAddError('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#878787]">Manage multiple Instantly.ai accounts and API keys</p>
          <p className="text-xs text-[#878787] mt-1">
            Get your API key from <a href="https://app.instantly.ai/app/settings/integrations" target="_blank" rel="noopener noreferrer" className="text-[#673ae4] hover:underline">Instantly Settings → Integrations</a>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add API Key</span>
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e3e3e3]">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-[#673ae4]" />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">API Keys ({apiKeys.length})</h2>
          </div>
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-[#e3e3e3] mx-auto mb-4" />
            <p className="text-[#878787] mb-2">No API keys configured</p>
            <p className="text-sm text-[#878787]">Add your first Instantly.ai API key to start syncing campaigns</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e3e3e3]">
            {apiKeys.map((key) => (
              <div key={key.id} className="px-6 py-4">
                {deleteConfirm === key.id ? (
                  // Delete Confirmation
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#1a1a1a]">
                        Delete API key <strong>{key.key_name || 'Unnamed'}</strong>?
                      </p>
                      <p className="text-xs text-[#878787]">
                        This action cannot be undone. Campaigns will no longer sync.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 text-sm text-[#878787] hover:bg-[#fafafa] rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal View
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        key.is_active ? 'bg-green-50' : 'bg-gray-100'
                      }`}>
                        <Key className={`w-5 h-5 ${key.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-[#1a1a1a] font-medium">
                            {key.key_name || 'Unnamed API Key'}
                          </p>
                          {key.is_active && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm text-[#878787] font-mono">
                            {showKeyId === key.id ? key.masked_key : key.masked_key}
                          </code>
                          <button
                            onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                            className="p-1 text-[#878787] hover:text-[#673ae4] transition-all"
                            title={showKeyId === key.id ? 'Hide' : 'Show'}
                          >
                            {showKeyId === key.id ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#878787] mt-1">
                          Added {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(key.id, key.is_active)}
                        className={`p-2 rounded-xl transition-all ${
                          key.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-[#878787] hover:bg-[#f3f4ff]'
                        }`}
                        title={key.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {key.is_active ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(key.id)}
                        className="p-2 text-[#878787] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How API Keys Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each API key represents a different Instantly.ai account</li>
          <li>• Active keys are used for campaign syncing operations</li>
          <li>• You can manage multiple accounts and toggle them as needed</li>
          <li>• Keys are validated when added to ensure they work</li>
        </ul>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#e3e3e3] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Add API Key</h3>
              <button
                onClick={resetAddModal}
                className="p-2 text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa] rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddKey} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Key Name (Optional)
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production, Testing, Account 1"
                  className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
                />
                <p className="text-xs text-[#878787] mt-1">
                  Give this key a name to help you identify it later
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Enter your Instantly.ai API key"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a] font-mono text-sm"
                />
                <p className="text-xs text-[#878787] mt-1">
                  Find this in Instantly → Settings → Integrations → API
                </p>
              </div>
              {addError && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-red-800 text-sm">{addError}</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={addLoading || !newKeyValue}
                  className="flex-1 py-3 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Validating...
                    </span>
                  ) : (
                    'Add API Key'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetAddModal}
                  className="px-6 py-3 border border-[#e3e3e3] text-[#1a1a1a] rounded-xl hover:bg-[#fafafa] transition-all"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-[#878787]">
                Note: You can have multiple active API keys to manage different Instantly.ai accounts.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
