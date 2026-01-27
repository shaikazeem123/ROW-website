import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function AddBeneficiaryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Male',
        dateOfRegistration: new Date().toISOString().split('T')[0],
        parentGuardian: '',
        relationship: 'Father',
        beneficiaryType: 'Direct',
        status: 'Active',
        address: '',
        addressType: 'Permanent',
        country: 'India',
        state: 'Karnataka',
        district: '',
        city: '',
        pincode: '',
        mobileNo: '',
        purposeOfVisit: 'Assessment',
        disabilityType: 'Locomotor',
        program: 'Rehab on Wheels',
        donor: '',
        economicStatus: 'BPL',
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('beneficiaries')
                .insert([{
                    name: formData.name,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    date_of_registration: formData.dateOfRegistration,
                    parent_guardian: formData.parentGuardian,
                    relationship: formData.relationship,
                    beneficiary_type: formData.beneficiaryType,
                    status: formData.status,
                    address: formData.address,
                    address_type: formData.addressType,
                    country: formData.country,
                    state: formData.state,
                    district: formData.district,
                    city: formData.city,
                    pincode: formData.pincode,
                    mobile_no: formData.mobileNo,
                    purpose_of_visit: formData.purposeOfVisit,
                    disability_type: formData.disabilityType,
                    program: formData.program,
                    donor: formData.donor,
                    economic_status: formData.economicStatus,
                    created_by: user?.id
                }]);

            if (error) throw error;
            navigate('/beneficiary/list');
        } catch (error: any) {
            console.error('Error saving beneficiary:', error);
            alert(error.message || 'Failed to save beneficiary');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Add New Beneficiary</h1>
                    <p className="text-text-muted">Register a new patient into the system.</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Personal Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-gray-100 pb-2">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Full Name" />
                            <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="Age" />
                            <Select
                                label="Gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                options={[
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Other', label: 'Other' },
                                ]}
                            />
                            <Input label="Date of Registration" name="dateOfRegistration" type="date" value={formData.dateOfRegistration} onChange={handleChange} />
                            <Input label="Parent/Guardian Name" name="parentGuardian" value={formData.parentGuardian} onChange={handleChange} placeholder="Guardian Name" />
                            <Select
                                label="Relationship"
                                name="relationship"
                                value={formData.relationship}
                                onChange={handleChange}
                                options={[
                                    { value: 'Father', label: 'Father' },
                                    { value: 'Mother', label: 'Mother' },
                                    { value: 'Spouse', label: 'Spouse' },
                                    { value: 'Sibling', label: 'Sibling' },
                                    { value: 'Other', label: 'Other' },
                                ]}
                            />
                            <Select
                                label="Type of Beneficiary"
                                name="beneficiaryType"
                                value={formData.beneficiaryType}
                                onChange={handleChange}
                                options={[
                                    { value: 'Direct', label: 'Direct' },
                                    { value: 'Outreach', label: 'Outreach' },
                                    { value: 'Referral', label: 'Referral' },
                                ]}
                            />
                            <Select
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' },
                                    { value: 'Deceased', label: 'Deceased' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Section: Contact & Address */}
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-gray-100 pb-2">Contact & Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="House No, Street, Landmark" />
                            </div>
                            <Select
                                label="Address Type"
                                name="addressType"
                                value={formData.addressType}
                                onChange={handleChange}
                                options={[
                                    { value: 'Permanent', label: 'Permanent' },
                                    { value: 'Temporary', label: 'Temporary' },
                                ]}
                            />
                            <Select
                                label="Country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                options={[
                                    { value: 'India', label: 'India' },
                                    { value: 'Nepal', label: 'Nepal' },
                                    { value: 'Bhutan', label: 'Bhutan' },
                                ]}
                            />
                            <Select
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                options={[
                                    { value: 'Maharashtra', label: 'Maharashtra' },
                                    { value: 'Gujarat', label: 'Gujarat' },
                                    { value: 'Karnataka', label: 'Karnataka' },
                                ]}
                            />
                            <Input label="District" name="district" value={formData.district} onChange={handleChange} placeholder="District" />
                            <Input label="City/Village" name="city" value={formData.city} onChange={handleChange} placeholder="City or Village" />
                            <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" />
                            <Input label="Mobile No" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="9876543210" maxLength={10} />
                        </div>
                    </div>

                    {/* Section: Program Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-gray-100 pb-2">Program Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select
                                label="Purpose of Visit"
                                name="purposeOfVisit"
                                value={formData.purposeOfVisit}
                                onChange={handleChange}
                                options={[
                                    { value: 'Assessment', label: 'Assessment' },
                                    { value: 'Treatment', label: 'Treatment' },
                                    { value: 'Follow-up', label: 'Follow-up' },
                                    { value: 'Aid Distribution', label: 'Aid Distribution' },
                                ]}
                            />
                            <Select
                                label="Disability Type"
                                name="disabilityType"
                                value={formData.disabilityType}
                                onChange={handleChange}
                                options={[
                                    { value: 'Locomotor', label: 'Locomotor' },
                                    { value: 'Visual', label: 'Visual' },
                                    { value: 'Hearing', label: 'Hearing' },
                                    { value: 'Speech', label: 'Speech' },
                                    { value: 'Multiple', label: 'Multiple' },
                                    { value: 'None', label: 'None' },
                                ]}
                            />
                            <Select
                                label="Program"
                                name="program"
                                value={formData.program}
                                onChange={handleChange}
                                options={[
                                    { value: 'Rehab on Wheels', label: 'Rehab on Wheels' },
                                    { value: 'Community Based Rehab', label: 'Community Based Rehab' },
                                    { value: 'Early Intervention', label: 'Early Intervention' },
                                ]}
                            />
                            <Input label="Donor" name="donor" value={formData.donor} onChange={handleChange} placeholder="Sponsor Name" />
                            <Select
                                label="Economic Status (APL/BPL)"
                                name="economicStatus"
                                value={formData.economicStatus}
                                onChange={handleChange}
                                options={[
                                    { value: 'APL', label: 'APL (Above Poverty Line)' },
                                    { value: 'BPL', label: 'BPL (Below Poverty Line)' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100 justify-end">
                        <Button type="button" variant="secondary" className="w-32">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-32 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>Saving...</>
                            ) : (
                                <><Save size={18} /> Save</>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
