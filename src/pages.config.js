import CoachAvailability from './pages/CoachAvailability';
import CoachDashboard from './pages/CoachDashboard';
import CoachOnboarding from './pages/CoachOnboarding';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import FamilyOnboarding from './pages/FamilyOnboarding';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PaymentSettings from './pages/PaymentSettings';
import ScheduleSession from './pages/ScheduleSession';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachAvailability": CoachAvailability,
    "CoachDashboard": CoachDashboard,
    "CoachOnboarding": CoachOnboarding,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "FamilyOnboarding": FamilyOnboarding,
    "Home": Home,
    "Messages": Messages,
    "PaymentSettings": PaymentSettings,
    "ScheduleSession": ScheduleSession,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};