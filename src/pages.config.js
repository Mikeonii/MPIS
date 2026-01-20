import AccountForm from './pages/AccountForm';
import AccountView from './pages/AccountView';
import Accounts from './pages/Accounts';
import Dashboard from './pages/Dashboard';
import Pharmacies from './pages/Pharmacies';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BarangayReports from './pages/BarangayReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountForm": AccountForm,
    "AccountView": AccountView,
    "Accounts": Accounts,
    "Dashboard": Dashboard,
    "Pharmacies": Pharmacies,
    "Reports": Reports,
    "Settings": Settings,
    "BarangayReports": BarangayReports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};