import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { PortfolioConstituent } from '../lib/portfolioService';

interface EditingConstituent extends Partial<PortfolioConstituent> {
  isNew?: boolean;
}

const PortfolioAdmin: React.FC = () => {
  const {
    portfolioData,
    quarters,
    loading,
    error,
    selectedQuarter,
    setSelectedQuarter,
    addConstituent,
    updateConstituent,
    deleteConstituent,
    refreshData
  } = usePortfolioData();

  const [editingItem, setEditingItem] = useState<EditingConstituent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (item: PortfolioConstituent) => {
    setEditingItem({ ...item });
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      if (editingItem.isNew) {
        const { isNew, id, created_at, updated_at, ...newItem } = editingItem;
        await addConstituent(newItem as Omit<PortfolioConstituent, 'id' | 'created_at' | 'updated_at'>);
      } else if (editingItem.id) {
        const { id, created_at, updated_at, ...updates } = editingItem;
        await updateConstituent(id, updates);
      }
      
      setEditingItem(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving constituent:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this constituent?')) {
      try {
        await deleteConstituent(id);
      } catch (error) {
        console.error('Error deleting constituent:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingItem({
      isNew: true,
      quarter: selectedQuarter || '',
      stock_name: '',
      stock_code: '',
      company_logo_url: '',
      weight: 0,
      quarterly_returns: 0
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleInputChange = (field: keyof PortfolioConstituent, value: string | number) => {
    if (!editingItem) return;
    
    setEditingItem({
      ...editingItem,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600">{error}</div>
          <button
            onClick={refreshData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Portfolio Administration</h1>
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Constituent</span>
          </button>
        </div>

        {/* Quarter Selector */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Quarter:</label>
          <select
            value={selectedQuarter || ''}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Quarter</option>
            {quarters.map((quarter) => (
              <option key={quarter.quarter} value={quarter.quarter}>
                {quarter.quarter} ({quarter.total_stocks} stocks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <div className="mb-6 bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem?.isNew ? 'Add New Constituent' : 'Edit Constituent'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <input
                type="text"
                value={editingItem?.quarter || ''}
                onChange={(e) => handleInputChange('quarter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Q1 2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Code</label>
              <input
                type="text"
                value={editingItem?.stock_code || ''}
                onChange={(e) => handleInputChange('stock_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TCS"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={editingItem?.stock_name || ''}
                onChange={(e) => handleInputChange('stock_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tata Consultancy Services Ltd."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={editingItem?.weight || ''}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8.33"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarterly Returns (%)</label>
              <input
                type="number"
                step="0.01"
                value={editingItem?.quarterly_returns || ''}
                onChange={(e) => handleInputChange('quarterly_returns', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15.2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={editingItem?.company_logo_url || ''}
                onChange={(e) => handleInputChange('company_logo_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://logo.clearbit.com/tcs.com"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Portfolio Constituents {selectedQuarter && `- ${selectedQuarter}`}
          </h2>
          <p className="text-sm text-gray-600">
            {portfolioData.length} constituents
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {portfolioData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {item.company_logo_url ? (
                          <img 
                            src={item.company_logo_url} 
                            alt={`${item.stock_code} logo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center" style={{ display: item.company_logo_url ? 'none' : 'flex' }}>
                          <span className="text-blue-600 font-semibold text-xs">
                            {item.stock_code.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.stock_code}</div>
                        <div className="text-sm text-gray-500">{item.stock_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{item.quarter}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{item.weight.toFixed(2)}%</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-medium ${
                      item.quarterly_returns >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.quarterly_returns >= 0 ? '+' : ''}{item.quarterly_returns.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {portfolioData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {selectedQuarter ? 
              `No constituents found for ${selectedQuarter}` : 
              'Select a quarter to view constituents'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAdmin;