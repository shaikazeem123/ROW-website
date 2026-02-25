import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User, Loader2, X } from 'lucide-react';
import { Card } from '@/components/common/Card';

interface Beneficiary {
    id: string;
    name: string;
    file_number: string | null;
}

interface BeneficiarySelectProps {
    onSelect: (beneficiary: Beneficiary) => void;
    selectedId?: string;
    selectedFileNumber?: string | null;
    placeholder?: string;
}

export function BeneficiarySelect({ onSelect, selectedId, selectedFileNumber, placeholder = "Select Beneficiary (File No / Name)" }: BeneficiarySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Beneficiary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch if selectedId or selectedFileNumber is provided
    useEffect(() => {
        if ((selectedId || selectedFileNumber) && !selectedBeneficiary) {
            const fetchSelected = async () => {
                let query = supabase.from('beneficiaries').select('id, name, file_number');

                if (selectedId) {
                    query = query.eq('id', selectedId);
                } else if (selectedFileNumber) {
                    query = query.eq('file_number', selectedFileNumber);
                }

                const { data, error } = await query.maybeSingle();

                if (!error && data) {
                    setSelectedBeneficiary(data);
                    setSearchTerm(`${data.file_number || 'N/A'} - ${data.name}`);
                }
            };
            fetchSelected();
        }
    }, [selectedId, selectedFileNumber, selectedBeneficiary]);

    const searchBeneficiaries = useCallback(async (term: string) => {
        if (!term || term.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Search by name or file_number
            const { data, error } = await supabase
                .from('beneficiaries')
                .select('id, name, file_number')
                .or(`name.ilike.%${term}%,file_number.ilike.%${term}%`)
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Error searching beneficiaries:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen && searchTerm !== (selectedBeneficiary ? `${selectedBeneficiary.file_number || 'N/A'} - ${selectedBeneficiary.name}` : '')) {
                searchBeneficiaries(searchTerm);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, searchBeneficiaries, isOpen, selectedBeneficiary]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (b: Beneficiary) => {
        setSelectedBeneficiary(b);
        setSearchTerm(`${b.file_number || 'N/A'} - ${b.name}`);
        setIsOpen(false);
        onSelect(b);
    };

    const clearSelection = () => {
        setSelectedBeneficiary(null);
        setSearchTerm('');
        setResults([]);
        // We probably need to notify parent that selection is cleared
        // But usually ServiceEntry requires it, so maybe just let them select another
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="text-sm font-semibold text-text-main mb-1.5 block">
                {placeholder}
            </label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    placeholder="Search by File Number or Name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {(searchTerm || selectedBeneficiary) && (
                    <button
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
                <Card className="absolute z-50 w-full mt-2 shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-64 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 flex items-center justify-center gap-2 text-text-muted text-sm">
                                <Loader2 size={16} className="animate-spin text-primary" />
                                Searching records...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {results.map((b) => (
                                    <button
                                        key={b.id}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-primary/5 text-left transition-colors group"
                                        onClick={() => handleSelect(b)}
                                    >
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                {b.file_number || 'N/A'} - {b.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">
                                                Click to select this beneficiary
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchTerm.length >= 2 ? (
                            <div className="p-8 text-center">
                                <Search size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-sm text-text-muted">No beneficiaries found for "{searchTerm}"</p>
                            </div>
                        ) : null}
                    </div>
                </Card>
            )}
        </div>
    );
}
