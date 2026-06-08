import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryProvider } from "@/app/QueryProvider.jsx";
import { AuthProvider } from "@/modules/auth/application/AuthProvider.jsx";
import { LoginScreen } from "@/modules/auth/presentation/screens/LoginScreen.jsx";
import { RegisterScreen } from "@/modules/auth/presentation/screens/RegisterScreen.jsx";
import { DashboardScreen } from "@/modules/dashboard/presentation/screens/DashboardScreen.jsx";
import {
  ProtectedRoute,
  GuestOnlyRoute,
} from "@/modules/auth/presentation/routes/ProtectedRoute.jsx";
import { OpsRoute } from "@/modules/scheduling/presentation/routes/OpsRoute.jsx";
import { MobileOnlyRoute } from "@/modules/auth/presentation/routes/MobileOnlyRoute.jsx";
import { MobileOnlyScreen } from "@/modules/auth/presentation/screens/MobileOnlyScreen.jsx";
import { SchedulesListScreen } from "@/modules/scheduling/presentation/screens/SchedulesListScreen.jsx";
import { CreateScheduleScreen } from "@/modules/scheduling/presentation/screens/CreateScheduleScreen.jsx";
import { StoresListScreen } from "@/modules/scheduling/presentation/screens/StoresListScreen.jsx";
import { ViewScheduleScreen } from "@/modules/scheduling/presentation/screens/ViewScheduleScreen.jsx";
import { EditScheduleScreen } from "@/modules/scheduling/presentation/screens/EditScheduleScreen.jsx";
import { RoutesListScreen } from "@/modules/scheduling/presentation/screens/RoutesListScreen.jsx";
import { EditStoreScreen } from "@/modules/scheduling/presentation/screens/EditStoreScreen.jsx";
import { AvailableDriversScreen } from "@/modules/scheduling/presentation/screens/AvailableDriversScreen.jsx";
import { ManagerOnlyRoute } from "@/modules/scheduling/presentation/routes/ManagerOnlyRoute.jsx";
import { PayrollViewerRoute } from "@/modules/payroll/presentation/routes/PayrollViewerRoute.jsx";
import { PayrollBillsListScreen } from "@/modules/payroll/presentation/screens/PayrollBillsListScreen.jsx";
import { PayrollBillDetailScreen } from "@/modules/payroll/presentation/screens/PayrollBillDetailScreen.jsx";
import { StorePayrollListScreen } from "@/modules/payroll/presentation/screens/StorePayrollListScreen.jsx";
import { UsersListScreen } from "@/modules/users/presentation/screens/UsersListScreen.jsx";
import { EditUserScreen } from "@/modules/users/presentation/screens/EditUserScreen.jsx";
import { CreateUserScreen } from "@/modules/users/presentation/screens/CreateUserScreen.jsx";
import { AssignRoleListScreen } from "@/modules/role-assignment/presentation/screens/AssignRoleListScreen.jsx";
import { AssignRoleDetailScreen } from "@/modules/role-assignment/presentation/screens/AssignRoleDetailScreen.jsx";
import { DriverDocumentsListScreen } from "@/modules/documents/presentation/screens/DriverDocumentsListScreen.jsx";
import { DriverDocumentReviewScreen } from "@/modules/documents/presentation/screens/DriverDocumentReviewScreen.jsx";
import { DocumentRequirementsScreen } from "@/modules/documents/presentation/screens/DocumentRequirementsScreen.jsx";
import { ChatListScreen } from "@/modules/chat/presentation/screens/ChatListScreen.jsx";
import { NewChatScreen } from "@/modules/chat/presentation/screens/NewChatScreen.jsx";
import { ChatThreadScreen } from "@/modules/chat/presentation/screens/ChatThreadScreen.jsx";
import { NotificationsScreen } from "@/modules/notifications/presentation/screens/NotificationsScreen.jsx";
import { NotificationsRoute } from "@/modules/notifications/presentation/routes/NotificationsRoute.jsx";
import { ProfileScreen } from "@/modules/auth/presentation/screens/ProfileScreen.jsx";
import { PayrollRouteDetailScreen } from "@/modules/payroll/presentation/screens/PayrollRouteDetailScreen.jsx";
import { DispatchTeamListScreen } from "@/modules/dispatch-team/presentation/screens/DispatchTeamListScreen.jsx";
import { DispatchTeamMemberScreen } from "@/modules/dispatch-team/presentation/screens/DispatchTeamMemberScreen.jsx";

/**
 * Root router (mirrors mobile app/(auth) + app/(app) layout wiring).
 */
export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <LoginScreen />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnlyRoute>
                  <RegisterScreen />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/mobile-only"
              element={
                <ProtectedRoute allowMobileOnly>
                  <MobileOnlyRoute>
                    <MobileOnlyScreen />
                  </MobileOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <SchedulesListScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/create"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <CreateScheduleScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id/edit"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <EditScheduleScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <ViewScheduleScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <RoutesListScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stores"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <StoresListScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stores/:id"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <EditStoreScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-drivers"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <AvailableDriversScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <PayrollBillsListScreen />
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/store-payroll"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <StorePayrollListScreen />
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/route/:id"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <PayrollRouteDetailScreen />
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/:id"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <PayrollBillDetailScreen />
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <ChatListScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/new"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <NewChatScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <ChatThreadScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsRoute>
                    <NotificationsScreen />
                  </NotificationsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatch-team"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <DispatchTeamListScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatch-team/:userId"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <DispatchTeamMemberScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <UsersListScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <CreateUserScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:userId"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <EditUserScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assign-role"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <AssignRoleListScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assign-role/:userId"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <AssignRoleDetailScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-documents"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <DriverDocumentsListScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-documents/requirements"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <DocumentRequirementsScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-documents/:driverId"
              element={
                <ProtectedRoute>
                  <ManagerOnlyRoute>
                    <DriverDocumentReviewScreen />
                  </ManagerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}
