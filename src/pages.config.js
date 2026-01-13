import CoachDashboard from './pages/CoachDashboard';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PaymentSettings from './pages/PaymentSettings';
import CoachOnboarding from './pages/CoachOnboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachDashboard": CoachDashboard,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "Home": Home,
    "Messages": Messages,
    "PaymentSettings": PaymentSettings,
    "CoachOnboarding": CoachOnboarding,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};