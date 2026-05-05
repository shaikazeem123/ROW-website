import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/Login';
import { UpdatePasswordPage } from '../pages/auth/UpdatePassword';
import { AuthCallbackPage } from '../pages/auth/AuthCallback';
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
import { RouteGuard } from './RouteGuard';
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
        path: '/auth/callback',
        element: <AuthCallbackPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        errorElement: <NotFoundPage />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { index: true, element: <DefaultRedirect /> },

                    {
                        element: <RouteGuard page="dashboard" />,
                        children: [
                            { path: 'dashboard', element: <DashboardPage /> },
                            { path: 'calendar', element: <CalendarPage /> },
                        ],
                    },

                    {
                        element: <RouteGuard page="tracking" />,
                        children: [
                            { path: 'tracking', element: <LiveBusTrackingPage /> },
                            { path: 'tracking/history', element: <TripHistoryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="tracking" requires="create" />,
                        children: [
                            { path: 'tracking/add-trip', element: <TripEntryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="tracking" requires="edit" />,
                        children: [
                            { path: 'tracking/edit-trip/:id', element: <TripEntryPage /> },
                        ],
                    },

                    {
                        element: <RouteGuard page="beneficiary" />,
                        children: [
                            { path: 'beneficiary/list', element: <BeneficiaryListPage /> },
                            { path: 'beneficiary/:id', element: <BeneficiaryProfilePage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="beneficiary" requires="create" />,
                        children: [
                            { path: 'beneficiary/add', element: <AddBeneficiaryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="beneficiary" requires="edit" />,
                        children: [
                            { path: 'beneficiary/edit/:id', element: <EditBeneficiaryPage /> },
                        ],
                    },

                    {
                        element: <RouteGuard page="services" />,
                        children: [
                            { path: 'services/history', element: <ServiceHistoryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="services" requires="create" />,
                        children: [
                            { path: 'services/new', element: <ServiceEntryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="services" requires="edit" />,
                        children: [
                            { path: 'services/edit/:id', element: <ServiceEntryPage /> },
                        ],
                    },

                    {
                        element: <RouteGuard page="assessments" />,
                        children: [
                            { path: 'assessments/history', element: <AssessmentHistoryPage /> },
                            { path: 'assessments/view/:patientId', element: <AssessmentViewPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="assessments" requires="create" />,
                        children: [
                            { path: 'assessments/new', element: <AssessmentEntryPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="assessments" requires="edit" />,
                        children: [
                            { path: 'assessments/edit/:patientId', element: <AssessmentEntryPage /> },
                        ],
                    },

                    {
                        element: <RouteGuard page="exercises" />,
                        children: [
                            { path: 'exercises/manage', element: <ExerciseManagementPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="reports" />,
                        children: [
                            { path: 'reports', element: <ReportsPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="settings" />,
                        children: [
                            { path: 'settings', element: <SettingsPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="admin" />,
                        children: [
                            { path: 'admin/control', element: <AdminControlPage /> },
                            { path: 'sync', element: <SyncDashboardPage /> },
                        ],
                    },
                    {
                        element: <RouteGuard page="tokens" />,
                        children: [
                            { path: 'token-management', element: <TokenManagementPage /> },
                        ],
                    },
                ]
            }
        ],
    },
]);
