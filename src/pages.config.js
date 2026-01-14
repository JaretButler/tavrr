import CoachOnboarding from './pages/CoachOnboarding';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import FamilyOnboarding from './pages/FamilyOnboarding';
import Messages from './pages/Messages';
import PaymentSettings from './pages/PaymentSettings';
import ScheduleSession from './pages/ScheduleSession';
import TestOnboarding from './pages/TestOnboarding';
import CoachAvailability from './pages/CoachAvailability';
import CoachDashboard from './pages/CoachDashboard';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachOnboarding": CoachOnboarding,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "FamilyOnboarding": FamilyOnboarding,
    "Messages": Messages,
    "PaymentSettings": PaymentSettings,
    "ScheduleSession": ScheduleSession,
    "TestOnboarding": TestOnboarding,
    "CoachAvailability": CoachAvailability,
    "CoachDashboard": CoachDashboard,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "TestOnboarding",
    Pages: PAGES,
    Layout: __Layout,
};