import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryProvider } from "@/app/QueryProvider.jsx";
import { AppFullscreen } from "@/app/AppFullscreen.jsx";
import { AuthProvider } from "@/modules/auth/application/AuthProvider.jsx";
import { PushNotificationBootstrap } from "@/modules/notifications/presentation/PushNotificationBootstrap.jsx";
import { PushNotificationInboxProvider } from "@/modules/notifications/presentation/context/PushNotificationInboxProvider.jsx";
import { OpsElevationProvider } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { OpsElevationRoute } from "@/modules/auth/presentation/routes/OpsElevationRoute.jsx";
import { TrackingSocketProvider } from "@/modules/tracking/application/TrackingSocketProvider.jsx";
import { ChatProvider } from "@/modules/chat/application/ChatProvider.jsx";
import { OpsLocationScopeProvider } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { OpsDateScopeProvider } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
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
import { ScheduleRoutesSpreadsheetScreen } from "@/modules/scheduling/presentation/screens/ScheduleRoutesSpreadsheetScreen.jsx";
import { RouteStopsScreen } from "@/modules/scheduling/presentation/screens/RouteStopsScreen.jsx";
import { RoutesListScreen } from "@/modules/scheduling/presentation/screens/RoutesListScreen.jsx";
import { ViewRouteScreen } from "@/modules/scheduling/presentation/screens/ViewRouteScreen.jsx";
import { StoreScreen } from "@/modules/scheduling/presentation/screens/StoreScreen.jsx";
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
import { NewGroupScreen } from "@/modules/chat/presentation/screens/NewGroupScreen.jsx";
import { ChatThreadScreen } from "@/modules/chat/presentation/screens/ChatThreadScreen.jsx";
import { ProfileScreen } from "@/modules/auth/presentation/screens/ProfileScreen.jsx";
import { PayrollRouteDetailScreen } from "@/modules/payroll/presentation/screens/PayrollRouteDetailScreen.jsx";
import { DispatchTeamListScreen } from "@/modules/dispatch-team/presentation/screens/DispatchTeamListScreen.jsx";
import { DispatchTeamMemberScreen } from "@/modules/dispatch-team/presentation/screens/DispatchTeamMemberScreen.jsx";
import { LiveTrackingScreen } from "@/modules/tracking/presentation/screens/LiveTrackingScreen.jsx";
import { RouteTrackingScreen } from "@/modules/tracking/presentation/screens/RouteTrackingScreen.jsx";
import { TrackingRoute } from "@/modules/tracking/presentation/routes/TrackingRoute.jsx";
import { LandingScreen } from "@/modules/landing/presentation/screens/LandingScreen.jsx";
/**
 * Root router (mirrors mobile app/(auth) + app/(app) layout wiring).
 */
export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppFullscreen />
        <AuthProvider>
          <PushNotificationInboxProvider>
          <PushNotificationBootstrap />
          <OpsElevationProvider>
          <TrackingSocketProvider>
          <ChatProvider>
          <OpsLocationScopeProvider>
          <OpsDateScopeProvider>
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
                    <OpsElevationRoute scope="dispatch">
                      <CreateScheduleScreen />
                    </OpsElevationRoute>
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
              path="/schedules/:id/routes/:routeId/stops"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <RouteStopsScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id/routes"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <ScheduleRoutesSpreadsheetScreen />
                  </OpsRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <TrackingRoute>
                    <LiveTrackingScreen />
                  </TrackingRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routes/tracking/:id"
              element={
                <ProtectedRoute>
                  <TrackingRoute>
                    <RouteTrackingScreen />
                  </TrackingRoute>
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
              path="/routes/:id"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <ViewRouteScreen />
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
                    <OpsElevationRoute scope="dispatch">
                      <StoreScreen />
                    </OpsElevationRoute>
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
                    <OpsElevationRoute scope="payroll">
                      <PayrollBillsListScreen />
                    </OpsElevationRoute>
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/store-payroll"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <OpsElevationRoute scope="payroll">
                      <StorePayrollListScreen />
                    </OpsElevationRoute>
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/route/:id"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <OpsElevationRoute scope="payroll">
                      <PayrollRouteDetailScreen />
                    </OpsElevationRoute>
                  </PayrollViewerRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/:id"
              element={
                <ProtectedRoute>
                  <PayrollViewerRoute>
                    <OpsElevationRoute scope="payroll">
                      <PayrollBillDetailScreen />
                    </OpsElevationRoute>
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
              path="/chat/new-group"
              element={
                <ProtectedRoute>
                  <OpsRoute>
                    <NewGroupScreen />
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
                    <OpsElevationRoute scope="dispatch">
                      <CreateUserScreen />
                    </OpsElevationRoute>
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
            <Route path="/" element={<LandingScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </OpsDateScopeProvider>
          </OpsLocationScopeProvider>
          </ChatProvider>
          </TrackingSocketProvider>
          </OpsElevationProvider>
          </PushNotificationInboxProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}
