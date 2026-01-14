import CoachAvailability from './pages/CoachAvailability';
import CoachOnboarding from './pages/CoachOnboarding';
import Contacts from './pages/Contacts';
import FamilyDashboard from './pages/FamilyDashboard';
import FamilyOnboarding from './pages/FamilyOnboarding';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PaymentSettings from './pages/PaymentSettings';
import ScheduleSession from './pages/ScheduleSession';
import TestOnboarding from './pages/TestOnboarding';
import InstructorDashboard from './pages/InstructorDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachAvailability": CoachAvailability,
    "CoachOnboarding": CoachOnboarding,
    "Contacts": Contacts,
    "FamilyDashboard": FamilyDashboard,
    "FamilyOnboarding": FamilyOnboarding,
    "Home": Home,
    "Messages": Messages,
    "PaymentSettings": PaymentSettings,
    "ScheduleSession": ScheduleSession,
    "TestOnboarding": TestOnboarding,
    "InstructorDashboard": InstructorDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};