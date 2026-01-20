import AccountForm from './pages/AccountForm';
import AccountView from './pages/AccountView';
import Accounts from './pages/Accounts';
import BarangayReports from './pages/BarangayReports';
import Dashboard from './pages/Dashboard';
import Pharmacies from './pages/Pharmacies';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SourceOfFunds from './pages/SourceOfFunds';
import FlexibleReports from './pages/FlexibleReports';
import Users from './pages/Users';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountForm": AccountForm,
    "AccountView": AccountView,
    "Accounts": Accounts,
    "BarangayReports": BarangayReports,
    "Dashboard": Dashboard,
    "Pharmacies": Pharmacies,
    "Reports": Reports,
    "Settings": Settings,
    "SourceOfFunds": SourceOfFunds,
    "FlexibleReports": FlexibleReports,
    "Users": Users,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};