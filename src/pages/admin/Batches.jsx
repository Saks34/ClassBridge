import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { Edit2, Trash2, Plus, Search, BookOpen } from 'lucide-react';

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder }) => {
    const { isDark } = useTheme();
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

    return (
        <div>
            <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>
                {label} {required && '*'}
            </label>
            <input
                type={type}
                required={required}
                className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${inputBg}`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};

export default function Batches() {
    const { isDark } = useTheme();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        academicYear: '',
        description: '',
    });

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';
    const cardBg = isDark ? 'bg-gray-900/60 backdrop-blur-xl border-white/10' : 'bg-white/60 backdrop-blur-xl border-gray-200/50';

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/batches');
            // The backend returns { status, message, data: { batches } }
            setBatches(data.data?.batches || []);
        } catch (error) {
            console.error('Failed to load batches:', error);
            toast.error(error?.response?.data?.message || 'Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            await api.post('/batches', formData);
            toast.success('Batch created successfully');
            setFormData({ name: '', academicYear: '', description: '' });
            setShowCreateModal(false);
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create batch');
        }
    };

    const handleEditBatch = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/batches/${selectedBatch._id}`, formData);
            toast.success('Batch updated successfully');
            setShowEditModal(false);
            setSelectedBatch(null);
            setFormData({ name: '', academicYear: '', description: '' });
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update batch');
        }
    };

    const handleDeleteBatch = async (batchId, batchName) => {
        if (!confirm(`Are you sure you want to delete "${batchName}"?`)) return;

        try {
            await api.delete(`/batches/${batchId}`);
            toast.success('Batch deleted successfully');
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete batch');
        }
    };

    const openEditModal = (batch) => {
        setSelectedBatch(batch);
        setFormData({
            name: batch.name,
            academicYear: batch.academicYear || '',
            description: batch.description || '',
        });
        setShowEditModal(true);
    };

    const columns = [
        { header: 'Batch Name', accessor: 'name' },
        {
            header: 'Academic Year',
            render: (row) => row.academicYear || '-'
        },
        {
            header: 'Student Count',
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                    {row.studentCount || 0} Students
                </span>
            ),
        },
        {
            header: 'Created',
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => openEditModal(row)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Batch"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteBatch(row._id, row.name)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Batch"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <LoadingSpinner centered />;
    }



    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>Batches</h1>
                    <p className={textSecondary}>Organize students into batches</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 transition-all font-medium`}
                >
                    <BookOpen size={18} />
                    Create Batch
                </button>
            </div>

            <div className={`${cardBg} border rounded-2xl p-6 shadow-xl`}>
                <Table
                    columns={columns}
                    data={batches}
                    emptyMessage="No batches found. Create your first batch to get started."
                />
            </div>

            {/* Create Batch Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', academicYear: '', description: '' });
                }}
                title="Create New Batch"
                size="sm"
            >
                <form onSubmit={handleCreateBatch} className="space-y-4">
                    <InputField
                        label="Batch Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Batch A, Class 10A"
                    />

                    <InputField
                        label="Academic Year"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                        placeholder="e.g., 2025-2026"
                    />

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>
                            Description
                        </label>
                        <textarea
                            className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${inputBg}`}
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional notes about this batch"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/30 transition-all">
                            Create Batch
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateModal(false);
                                setFormData({ name: '', academicYear: '', description: '' });
                            }}
                            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Batch Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedBatch(null);
                    setFormData({ name: '', academicYear: '', description: '' });
                }}
                title="Edit Batch"
                size="sm"
            >
                <form onSubmit={handleEditBatch} className="space-y-4">
                    <InputField
                        label="Batch Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <InputField
                        label="Academic Year"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    />

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>
                            Description
                        </label>
                        <textarea
                            className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${inputBg}`}
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/30 transition-all">
                            Update Batch
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedBatch(null);
                                setFormData({ name: '', academicYear: '', description: '' });
                            }}
                            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
