import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountForm from './pages/AccountForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Accounts": Accounts,
    "AccountForm": AccountForm,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};