import CoachDashboard from './pages/CoachDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import Home from './pages/Home';
import PaymentSettings from './pages/PaymentSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachDashboard": CoachDashboard,
    "FamilyDashboard": FamilyDashboard,
    "Home": Home,
    "PaymentSettings": PaymentSettings,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};