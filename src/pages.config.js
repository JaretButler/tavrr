import CoachDashboard from './pages/CoachDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CoachDashboard": CoachDashboard,
    "FamilyDashboard": FamilyDashboard,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "CoachDashboard",
    Pages: PAGES,
    Layout: __Layout,
};