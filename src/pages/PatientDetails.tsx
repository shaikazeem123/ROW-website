import { useParams } from 'react-router-dom';

export function PatientDetailsPage() {
    const { id } = useParams();
    return (
        <div>
            <h1 className="text-2xl mb-4">Patient Details</h1>
            <p className="text-text-muted">Viewing details for patient ID: {id}</p>
        </div>
    );
}
