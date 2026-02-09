import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Save, Wifi, WifiOff, Printer, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineStorage } from '@/utils/offlineUtils';

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #printable-token, #printable-token * { visibility: visible; }
    #printable-token {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      text-align: center;
      padding: 40px;
      border: 2px dashed #000;
    }
  }
`;
import { TokenService } from '@/services/tokenService';

export function AddBeneficiaryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [assignedToken, setAssignedToken] = useState<string | number | null>(null);
    const [isOfflineRecord, setIsOfflineRecord] = useState(false);
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

        const nextSequence = await TokenService.getNextToken();
        const tempToken = OfflineStorage.generateOfflineToken('FIELD', nextSequence);

        const beneficiaryData = {
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
            created_by: user?.id,
            offline_token: tempToken,
            created_at: new Date().toISOString(),
        };

        try {
            await db.beneficiaries.add({
                ...beneficiaryData,
                sync_status: 'pending'
            });

            // Update local token tracking
            await TokenService.updateLastToken(nextSequence);

            if (isOnline) {
                // Try to sync with Supabase immediately if online
                const { data, error } = await supabase
                    .from('beneficiaries')
                    .insert([beneficiaryData])
                    .select('*')
                    .single();

                if (!error) {
                    // Update local record if sync was successful
                    await db.beneficiaries.where('offline_token').equals(tempToken).modify({
                        sync_status: 'synced'
                    });
                    setAssignedToken(data.token_no);
                    setIsOfflineRecord(false);
                } else {
                    console.error('Immediate sync failed, record remains pending:', error);
                    setAssignedToken(tempToken);
                    setIsOfflineRecord(true);
                }
            } else {
                setAssignedToken(tempToken);
                setIsOfflineRecord(true);
            }

            setShowSuccessModal(true);

            // Note: We don't navigate immediately anymore so the user can see the token popup
        } catch (error: any) {
            console.error('Error saving beneficiary:', error);
            alert(error.message || 'Failed to save beneficiary');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintToken = () => {
        window.print();
    };

    const handleDownloadToken = () => {
        const text = `
----------------------------
  REHAB ON WHEELS (ROW)
----------------------------
Patient: ${formData.name}
Token No: ${assignedToken}
Date: ${formData.dateOfRegistration}
Status: ${isOfflineRecord ? 'OFFLINE (PENDING)' : 'OFFICIAL'}
----------------------------
        `;
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `ROW-Token-${assignedToken}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
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
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-colors ${isOnline
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                    {isOnline ? (
                        <><Wifi size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Online Mode</span></>
                    ) : (
                        <><WifiOff size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Offline Mode</span></>
                    )}
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

            {/* Success Modal Popup */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-primary p-8 text-center text-white">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                <span className="text-4xl">✅</span>
                            </div>
                            <h2 className="text-2xl font-black mb-1">Registration Successful!</h2>
                            <p className="text-white/80 text-sm">Patient has been registered</p>
                        </div>

                        <div className="p-8 text-center">
                            <p className="text-text-muted text-xs uppercase font-bold tracking-widest mb-2">
                                {isOfflineRecord ? 'Temporary Offline Token' : 'Official Token Number'}
                            </p>
                            <div className="text-6xl font-black text-primary mb-2 tabular-nums">
                                {assignedToken ? `#${assignedToken}` : 'N/A'}
                            </div>

                            {isOfflineRecord && (
                                <div className="mb-6 flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase border border-orange-100">
                                        <WifiOff size={12} /> Pending Sync
                                    </div>
                                    <p className="text-[10px] text-text-muted max-w-[200px] leading-tight">
                                        This record is saved locally and will sync when internet returns.
                                    </p>
                                </div>
                            )}

                            {!assignedToken && !isOfflineRecord && (
                                <p className="text-red-500 text-[10px] font-bold mb-4">
                                    Warning: Token column or trigger missing in Supabase.
                                </p>
                            )}

                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate('/beneficiary/list')}
                                    className="w-full py-4 rounded-xl text-lg font-bold"
                                >
                                    Go to List
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrintToken}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2"
                                    >
                                        <Printer size={18} /> Print Slip
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadToken}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2"
                                    >
                                        <Download size={18} /> Save Text
                                    </Button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setFormData(prev => ({
                                            ...prev,
                                            name: '',
                                            age: '',
                                            mobileNo: ''
                                        }));
                                    }}
                                    className="w-full text-text-muted hover:text-text-main font-semibold transition-colors py-2"
                                >
                                    Add Another Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Hidden printable token slip */}
            <style>{printStyles}</style>
            <div id="printable-token" className="hidden">
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                    <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>REHAB ON WHEELS (ROW)</h1>
                    <p style={{ margin: '5px 0' }}>Community Outreach Program</p>
                    <hr style={{ margin: '15px 0' }} />
                    <p style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666' }}>Patient Token</p>
                    <div style={{ fontSize: '60px', fontWeight: 'bold', margin: '10px 0' }}>#{assignedToken}</div>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{formData.name}</p>
                    <p style={{ fontSize: '14px' }}>Date: {formData.dateOfRegistration}</p>
                    <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
                        This is a computer generated slip for the ROW project.
                    </div>
                </div>
            </div>
        </div>
    );
}
