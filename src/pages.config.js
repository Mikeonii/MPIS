import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountForm from './pages/AccountForm';
import AccountView from './pages/AccountView';
import Pharmacies from './pages/Pharmacies';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Accounts": Accounts,
    "AccountForm": AccountForm,
    "AccountView": AccountView,
    "Pharmacies": Pharmacies,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};