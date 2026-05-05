export interface Exercise {
    id?: number;
    name: string;
    heading: string;
    description: string;
    category: string;
    condition: string | null;
    pdf_url: string | null;
    thumbnail_url: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export type ExerciseFormData = Omit<Exercise, 'id' | 'created_at' | 'updated_at'>;

export interface PatientRecommendedExercise {
    id?: number;
    patient_id: string;
    exercise_id: number;
    times: string | null;
    repetitions: string | null;
    sets: string | null;
    hold: string | null;
    notes: string | null;
    created_at?: string;
    exercise?: Exercise; // joined data
}

export interface SelectedExercise {
    exercise: Exercise;
    times: string;
    repetitions: string;
    sets: string;
    hold: string;
    notes: string;
}
