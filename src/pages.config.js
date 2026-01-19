import AccountForm from './pages/AccountForm';
import AccountView from './pages/AccountView';
import Accounts from './pages/Accounts';
import Dashboard from './pages/Dashboard';
import Pharmacies from './pages/Pharmacies';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountForm": AccountForm,
    "AccountView": AccountView,
    "Accounts": Accounts,
    "Dashboard": Dashboard,
    "Pharmacies": Pharmacies,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};