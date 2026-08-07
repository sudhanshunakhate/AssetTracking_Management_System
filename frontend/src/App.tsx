import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { AppBusyBridge } from '@/loading/AppBusyBridge'
import { GlobalLoader } from '@/loading/GlobalLoader'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import {
  ExceptionsMaster,
  GeneralMastersMaster,
  GeneralTypesMaster,
  InventoryCategoriesMaster,
  InventorySubCategoriesMaster,
  OperatingUnitsMaster,
  OrganizationsMaster,
  RolesMaster,
  StoresMaster,
  UnitsMaster,
  UsersMaster,
} from '@/features/masters/MasterPages'
import { EmployeesMaster } from '@/features/masters/EmployeeMasterPages'
import { ItemsMaster, VendorsMaster } from '@/features/masters/ItemVendorMasterPages'
import { FullReportPage } from '@/features/reports/FullReportPage'
import { ItemRegisterPage } from '@/features/reports/ItemRegisterPage'
import { StockMovementReportPage } from '@/features/reports/StockMovementReportPage'
import { StockOwnerReportPage } from '@/features/reports/StockOwnerReportPage'
import { StockRegisterPage } from '@/features/reports/StockRegisterPage'
import { GatepassPage } from '@/features/transactions/GatepassPage'
import { GrnPages } from '@/features/transactions/GrnPage'
import { OpeningStockPages } from '@/features/transactions/OpeningStockPage'
import { IssuesPages } from '@/features/transactions/IssuePage'
import { RequisitionsPages } from '@/features/transactions/RequisitionPage'
import { ReturnsPages } from '@/features/transactions/TransactionPages'
import { TransfersPages } from '@/features/transactions/TransferPage'

function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <AppBusyBridge />
      <GlobalLoader />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/masters/units/*" element={<UnitsMaster />} />
          <Route path="/masters/items/*" element={<ItemsMaster />} />
          <Route path="/masters/inventory-categories/*" element={<InventoryCategoriesMaster />} />
          <Route path="/masters/inventory-sub-categories/*" element={<InventorySubCategoriesMaster />} />
          <Route path="/masters/general-types/*" element={<GeneralTypesMaster />} />
          <Route path="/masters/general-masters/*" element={<GeneralMastersMaster />} />
          <Route path="/masters/vendors/*" element={<VendorsMaster />} />
          <Route path="/masters/organizations/*" element={<OrganizationsMaster />} />
          <Route path="/masters/operating-units/*" element={<OperatingUnitsMaster />} />
          <Route path="/masters/stores/*" element={<StoresMaster />} />
          <Route path="/masters/roles/*" element={<RolesMaster />} />
          <Route path="/masters/employees/*" element={<EmployeesMaster />} />
          <Route path="/masters/users/*" element={<UsersMaster />} />
          <Route path="/masters/menu-access" element={<Navigate to="/masters/roles" replace />} />
          <Route path="/masters/exceptions/*" element={<ExceptionsMaster />} />

          <Route path="/transactions/opening-stock/*" element={<OpeningStockPages />} />
          <Route path="/transactions/requisitions/*" element={<RequisitionsPages />} />
          <Route path="/transactions/grn/*" element={<GrnPages />} />
          <Route path="/transactions/gatepass" element={<GatepassPage />} />
          <Route path="/transactions/issues/*" element={<IssuesPages />} />
          <Route path="/transactions/transfers/*" element={<TransfersPages />} />
          <Route path="/transactions/returns/*" element={<ReturnsPages />} />

          <Route path="/reports/stock-register" element={<StockRegisterPage />} />
          <Route path="/reports/full-report" element={<FullReportPage />} />
          <Route path="/reports/stock-owner" element={<StockOwnerReportPage />} />
          <Route path="/reports/stock-movement" element={<StockMovementReportPage />} />
          <Route path="/reports/item-register" element={<ItemRegisterPage />} />
        </Route>
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AuthProvider>
  )
}
