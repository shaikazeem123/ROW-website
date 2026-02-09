/**
 * Utility to export beneficiaries data to CSV (compatible with Excel)
 */
export const exportBeneficiariesToCSV = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return;

    // Define the columns based on user requirement image
    const headers = [
        'NAME',
        'AGE',
        'GENDER',
        'DATE OF REGISTRATION',
        'PARENT/GUARDIAN NAME',
        'RELATIONSHIP',
        'TYPE OF BENEFICIARY',
        'STATUS',
        'ADDRESS',
        'ADDRESS TYPE',
        'COUNTRY',
        'STATE',
        'DISTRICT',
        'CITY',
        'PINCODE',
        'MOBILE NO',
        'PURPOSE OF VISIT',
        'DISABILITY TYPE',
        'PROGRAM',
        'DONOR',
        'APL/BPL'
    ];

    // Map the database data to the specified columns
    const rows = data.map(b => [
        `"${b.name || ''}"`,
        b.age || '',
        b.gender || '',
        b.date_of_registration || '',
        `"${b.parent_guardian || ''}"`,
        b.relationship || '',
        b.beneficiary_type || '',
        b.status || '',
        `"${b.address || ''}"`,
        b.address_type || '',
        b.country || '',
        b.state || '',
        b.district || '',
        b.city || '',
        b.pincode || '',
        b.mobile_no || '',
        b.purpose_of_visit || '',
        b.disability_type || '',
        b.program || '',
        `"${b.donor || ''}"`,
        b.economic_status || ''
    ]);

    // Construct CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Set filename with current date
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Beneficiary_Report_${date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
