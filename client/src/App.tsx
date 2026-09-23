import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Community from "./pages/Community";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import BrandSplash from "./components/BrandSplash";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import Login from "./pages/Login";
import LostFound from "./pages/LostFound";
import UpdateNotice from "./components/UpdateNotice";
import PriceGuide from "./pages/PriceGuide";
import CareTools from "./pages/CareTools";
function Router() { return <Switch><Route path="/" component={Home} /><Route path="/login" component={Login} /><Route path="/lost-found" component={LostFound} /><Route path="/marketplace" component={Marketplace} /><Route path="/prices" component={PriceGuide} /><Route path="/care-tools" component={CareTools} /><Route path="/listing/:id/edit" component={EditListing} /><Route path="/listing/:id" component={ListingDetails} /><Route path="/sell" component={CreateListing} /><Route path="/community" component={Community} /><Route path="/favorites" component={Favorites} /><Route path="/messages" component={Messages} /><Route path="/notifications" component={Notifications} /><Route path="/admin" component={AdminDashboard} /><Route path="/profile" component={Profile} /><Route path="/my-listings" component={MyListings} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
function App() { return <ErrorBoundary><LanguageProvider><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><UpdateNotice /><BrandSplash /><Router /></TooltipProvider></ThemeProvider></LanguageProvider></ErrorBoundary>; }
export default App;
