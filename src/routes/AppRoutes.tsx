import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/Login';
import { UpdatePasswordPage } from '../pages/auth/UpdatePassword';
import { DashboardPage } from '../pages/dashboard/Dashboard';
import { CalendarPage } from '../pages/calendar/Calendar';
import { LiveBusTrackingPage } from '../pages/tracking/LiveBusTracking';
import { TripEntryPage } from '../pages/tracking/TripEntry';
import { TripHistoryPage } from '../pages/tracking/TripHistory';
import { AddBeneficiaryPage } from '../pages/beneficiary/AddBeneficiary';
import { EditBeneficiaryPage } from '../pages/beneficiary/EditBeneficiary';
import { BeneficiaryListPage } from '../pages/beneficiary/BeneficiaryList';
import { BeneficiaryProfilePage } from '../pages/beneficiary/BeneficiaryProfile';
import { ServiceEntryPage } from '../pages/services/ServiceEntry';
import { ServiceHistoryPage } from '../pages/services/ServiceHistory';
import { ReportsPage } from '../pages/reports/Reports';
import { SettingsPage } from '../pages/settings/Settings';
import { SyncDashboardPage } from '../pages/admin/SyncDashboard';
import { AdminControlPage } from '../pages/admin/AdminControl';
import { TokenManagementPage } from '../pages/tokens/TokenManagement';
import { AssessmentEntryPage } from '../pages/assessment/AssessmentEntry';
import { AssessmentHistoryPage } from '../pages/assessment/AssessmentHistory';
import { AssessmentViewPage } from '../pages/assessment/AssessmentView';
import { ExerciseManagementPage } from '../pages/exercises/ExerciseManagement';
import { NotFoundPage } from '../pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { DefaultRedirect } from './DefaultRedirect';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/update-password',
        element: <UpdatePasswordPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        errorElement: <NotFoundPage />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        index: true,
                        element: <DefaultRedirect />,
                    },
                    {
                        path: 'dashboard',
                        element: <DashboardPage />,
                    },
                    {
                        path: 'calendar',
                        element: <CalendarPage />,
                    },
                    {
                        path: 'tracking',
                        element: <LiveBusTrackingPage />,
                    },
                    {
                        path: 'tracking/add-trip',
                        element: <TripEntryPage />,
                    },
                    {
                        path: 'tracking/history',
                        element: <TripHistoryPage />,
                    },
                    {
                        path: 'tracking/edit-trip/:id',
                        element: <TripEntryPage />,
                    },
                    {
                        path: 'beneficiary/add',
                        element: <AddBeneficiaryPage />,
                    },
                    {
                        path: 'beneficiary/list',
                        element: <BeneficiaryListPage />,
                    },
                    {
                        path: 'beneficiary/:id',
                        element: <BeneficiaryProfilePage />,
                    },
                    {
                        path: 'beneficiary/edit/:id',
                        element: <EditBeneficiaryPage />,
                    },
                    {
                        path: 'services/new',
                        element: <ServiceEntryPage />,
                    },
                    {
                        path: 'services/edit/:id',
                        element: <ServiceEntryPage />,
                    },
                    {
                        path: 'services/history',
                        element: <ServiceHistoryPage />,
                    },
                    {
                        path: 'assessments/new',
                        element: <AssessmentEntryPage />,
                    },
                    {
                        path: 'assessments/history',
                        element: <AssessmentHistoryPage />,
                    },
                    {
                        path: 'assessments/view/:patientId',
                        element: <AssessmentViewPage />,
                    },
                    {
                        path: 'assessments/edit/:patientId',
                        element: <AssessmentEntryPage />,
                    },
                    {
                        path: 'exercises/manage',
                        element: <ExerciseManagementPage />,
                    },
                    {
                        path: 'reports',
                        element: <ReportsPage />,
                    },
                    {
                        path: 'settings',
                        element: <SettingsPage />,
                    },
                    {
                        path: 'admin/control',
                        element: <AdminControlPage />,
                    },
                    {
                        path: 'token-management',
                        element: <TokenManagementPage />,
                    },
                    {
                        path: 'sync',
                        element: <SyncDashboardPage />,
                    },
                ]
            }
        ],
    },
]);
