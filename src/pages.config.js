import CoachDashboard from './pages/CoachDashboard';
import CoachOnboarding from './pages/CoachOnboarding';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import FamilyOnboarding from './pages/FamilyOnboarding';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PaymentSettings from './pages/PaymentSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachDashboard": CoachDashboard,
    "CoachOnboarding": CoachOnboarding,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "FamilyOnboarding": FamilyOnboarding,
    "Home": Home,
    "Messages": Messages,
    "PaymentSettings": PaymentSettings,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};