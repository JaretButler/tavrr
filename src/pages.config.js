import CoachDashboard from './pages/CoachDashboard';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import Home from './pages/Home';
import PaymentSettings from './pages/PaymentSettings';
import Messages from './pages/Messages';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachDashboard": CoachDashboard,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "Home": Home,
    "PaymentSettings": PaymentSettings,
    "Messages": Messages,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};