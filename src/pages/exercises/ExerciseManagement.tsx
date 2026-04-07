import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { exerciseService } from '@/services/exerciseService';
import { EXERCISE_CATEGORIES, EXERCISE_CONDITIONS } from '@/constants/exerciseConstants';
import type { Exercise, ExerciseFormData } from '@/types/exercise';
import {
    Dumbbell,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Upload,
    Filter,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    ImageIcon,
} from 'lucide-react';

const emptyForm: ExerciseFormData = {
    name: '',
    heading: '',
    description: '',
    category: '',
    condition: null,
    pdf_url: null,
    thumbnail_url: null,
    is_active: true,
};

export function ExerciseManagementPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<ExerciseFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterCondition, setFilterCondition] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const data = await exerciseService.getAll();
            setExercises(data);
        } catch (err) {
            console.error('Failed to fetch exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (file: File | null) => {
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.heading || !form.description || !form.category) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            let thumbnailUrl = form.thumbnail_url;

            // Upload image if selected
            if (imageFile) {
                try {
                    thumbnailUrl = await exerciseService.uploadFile(imageFile, 'images');
                } catch (uploadErr) {
                    console.error('Image upload failed:', uploadErr);
                    // Continue saving without image — bucket may not exist yet
                    alert('Image upload failed (storage bucket may not be set up). Exercise will be saved without image.');
                    thumbnailUrl = null;
                }
            }

            const exerciseData: ExerciseFormData = {
                ...form,
                pdf_url: null,
                thumbnail_url: thumbnailUrl,
            };

            if (editingId) {
                await exerciseService.update(editingId, exerciseData);
            } else {
                await exerciseService.create(exerciseData);
            }

            resetForm();
            await fetchExercises();
            alert(editingId ? 'Exercise updated successfully!' : 'Exercise added successfully!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save exercise. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (exercise: Exercise) => {
        setForm({
            name: exercise.name,
            heading: exercise.heading,
            description: exercise.description,
            category: exercise.category,
            condition: exercise.condition,
            pdf_url: null,
            thumbnail_url: exercise.thumbnail_url,
            is_active: exercise.is_active,
        });
        setEditingId(exercise.id || null);
        setShowForm(true);
        setImageFile(null);
        setImagePreview(exercise.thumbnail_url || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (exercise: Exercise) => {
        if (!exercise.id) return;
        if (!confirm(`Are you sure you want to delete "${exercise.name}"?`)) return;

        try {
            if (exercise.thumbnail_url) await exerciseService.deleteFile(exercise.thumbnail_url);
            await exerciseService.delete(exercise.id);
            await fetchExercises();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete exercise.');
        }
    };

    const handleToggleActive = async (exercise: Exercise) => {
        if (!exercise.id) return;
        try {
            await exerciseService.toggleActive(exercise.id, exercise.is_active);
            await fetchExercises();
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setShowForm(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const filteredExercises = exercises.filter((ex) => {
        const matchesSearch =
            !searchQuery ||
            ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || ex.category === filterCategory;
        const matchesCondition = !filterCondition || ex.condition === filterCondition;
        return matchesSearch && matchesCategory && matchesCondition;
    });

    // Group by category
    const groupedExercises: Record<string, Exercise[]> = {};
    filteredExercises.forEach((ex) => {
        if (!groupedExercises[ex.category]) groupedExercises[ex.category] = [];
        groupedExercises[ex.category].push(ex);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-main flex items-center gap-2">
                        <Dumbbell className="text-primary" /> Exercise Library
                    </h1>
                    <p className="text-text-muted text-sm">
                        Manage exercises that can be recommended to beneficiaries.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    className="flex items-center gap-2"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add Exercise'}
                </Button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="border-2 border-primary/20">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100">
                            <Dumbbell size={18} className="text-primary" />
                            <h3 className="font-semibold text-text-main">
                                {editingId ? 'Edit Exercise' : 'Add New Exercise'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Exercise Name *"
                                placeholder="e.g., Quadriceps Strengthening"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Heading *"
                                placeholder="e.g., Lower Limb Strengthening"
                                value={form.heading}
                                onChange={(e) => setForm({ ...form, heading: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-text-main block mb-1">
                                Description *
                            </label>
                            <textarea
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-y"
                                placeholder="Brief description of the exercise, instructions, and benefits..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-main block mb-1">
                                    Category *
                                </label>
                                <select
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {EXERCISE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-main block mb-1">
                                    Condition (Optional)
                                </label>
                                <select
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    value={form.condition || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, condition: e.target.value || null })
                                    }
                                >
                                    <option value="">All Conditions (General)</option>
                                    {EXERCISE_CONDITIONS.map((cond) => (
                                        <option key={cond} value={cond}>
                                            {cond}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Exercise Image Upload */}
                        <div>
                            <label className="text-sm font-medium text-text-main block mb-1">
                                Exercise Image
                            </label>
                            <div className="flex items-start gap-4">
                                {/* Preview */}
                                <div className="shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                    {imagePreview || form.thumbnail_url ? (
                                        <img
                                            src={imagePreview || form.thumbnail_url || ''}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon size={24} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Upload size={16} className="text-text-muted" />
                                        <span className="text-sm text-text-muted truncate">
                                            {imageFile
                                                ? imageFile.name
                                                : form.thumbnail_url
                                                ? 'Image uploaded — choose new'
                                                : 'Choose exercise image'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                handleImageSelect(e.target.files?.[0] || null)
                                            }
                                        />
                                    </label>
                                    {(imageFile || form.thumbnail_url) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleImageSelect(null);
                                                setForm({ ...form, thumbnail_url: null });
                                            }}
                                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                        >
                                            <X size={12} /> Remove image
                                        </button>
                                    )}
                                    <p className="text-[11px] text-gray-400">
                                        Upload an illustration image for this exercise (PNG, JPG)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) =>
                                        setForm({ ...form, is_active: e.target.checked })
                                    }
                                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                                />
                                <span className="text-sm text-text-main">Active (visible to staff)</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                    ? 'Update Exercise'
                                    : 'Add Exercise'}
                            </Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Filters & Search */}
            <Card>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <select
                                className="pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {EXERCISE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <select
                            className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            value={filterCondition}
                            onChange={(e) => setFilterCondition(e.target.value)}
                        >
                            <option value="">All Conditions</option>
                            {EXERCISE_CONDITIONS.map((cond) => (
                                <option key={cond} value={cond}>
                                    {cond}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="!p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                    <p className="text-xs text-text-muted">Total Exercises</p>
                </Card>
                <Card className="!p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {exercises.filter((e) => e.is_active).length}
                    </p>
                    <p className="text-xs text-text-muted">Active</p>
                </Card>
                <Card className="!p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                        {new Set(exercises.map((e) => e.category)).size}
                    </p>
                    <p className="text-xs text-text-muted">Categories</p>
                </Card>
                <Card className="!p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                        {exercises.filter((e) => e.thumbnail_url).length}
                    </p>
                    <p className="text-xs text-text-muted">With Images</p>
                </Card>
            </div>

            {/* Exercise Cards */}
            {loading ? (
                <div className="text-center py-12 text-text-muted">Loading exercises...</div>
            ) : filteredExercises.length === 0 ? (
                <Card className="text-center py-12">
                    <Dumbbell className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-text-muted font-medium">No exercises found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {exercises.length === 0
                            ? 'Add your first exercise using the button above.'
                            : 'Try adjusting your search or filters.'}
                    </p>
                </Card>
            ) : (
                Object.entries(groupedExercises).map(([category, items]) => (
                    <div key={category}>
                        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Dumbbell size={14} />
                            {category}
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                {items.length}
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {items.map((exercise) => (
                                <Card
                                    key={exercise.id}
                                    className={`!p-0 overflow-hidden transition-all hover:shadow-md ${
                                        !exercise.is_active ? 'opacity-60' : ''
                                    }`}
                                >
                                    {/* Card Thumbnail */}
                                    {exercise.thumbnail_url && (
                                        <div className="w-full h-36 bg-gray-100 overflow-hidden">
                                            <img
                                                src={exercise.thumbnail_url}
                                                alt={exercise.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className="p-4 pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-text-main truncate">
                                                    {exercise.name}
                                                </h3>
                                                <p className="text-xs text-primary font-medium mt-0.5">
                                                    {exercise.heading}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setExpandedCard(
                                                        expandedCard === exercise.id
                                                            ? null
                                                            : exercise.id || null
                                                    )
                                                }
                                                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg shrink-0"
                                            >
                                                {expandedCard === exercise.id ? (
                                                    <ChevronUp size={14} />
                                                ) : (
                                                    <ChevronDown size={14} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                {exercise.category}
                                            </span>
                                            {exercise.condition && (
                                                <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                                                    {exercise.condition}
                                                </span>
                                            )}
                                            {!exercise.is_active && (
                                                <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Description */}
                                    {expandedCard === exercise.id && (
                                        <div className="px-4 pb-2">
                                            <p className="text-sm text-text-muted leading-relaxed border-t border-gray-100 pt-2">
                                                {exercise.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Card Actions */}
                                    <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
                                        <button
                                            onClick={() => handleEdit(exercise)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit3 size={13} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(exercise)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                                                exercise.is_active
                                                    ? 'text-amber-600 hover:bg-amber-50'
                                                    : 'text-green-600 hover:bg-green-50'
                                            }`}
                                        >
                                            {exercise.is_active ? (
                                                <>
                                                    <EyeOff size={13} /> Hide
                                                </>
                                            ) : (
                                                <>
                                                    <Eye size={13} /> Show
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exercise)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
