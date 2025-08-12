import React, { useState, useEffect, createContext, useContext } from 'react';
import { Container, Card, Form, Button, Row, Col, Stack, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsExclamationCircleFill } from 'react-icons/bs';
import { useUpdateProfileMutation } from '../auth/authApiSlice';
import { useSelector } from 'react-redux';
import { selectProfile } from '../auth/authSlice';
import { selectRoles } from '../auth/authSlice';

// --- End of Placeholder ---

// --- Settings Context (for UI settings only) ---
export const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // Initial default settings
    const initialSettings = {
        minWholesaleOrder: 500,
        currency: 'UGX',
        autoPriceDetermination: false,
        lowLevelProducts: 10,
        lowLevelMaterials: 50,
        notificationFrequency: 'Weekly',
        theme: 'light',
        navbarColor: '#008000',
        sidebarColor: '#f8f9fa',
    };

    const [settings, setSettings] = useState(() => {
        // Load saved settings from localStorage on initial load, or use defaults
        const savedSettings = localStorage.getItem('appSettings');
        return savedSettings ? JSON.parse(savedSettings) : initialSettings;
    });

    useEffect(() => {
        // Persist settings to localStorage whenever they change
        localStorage.setItem('appSettings', JSON.stringify(settings));
        // Apply theme change to the document
        document.documentElement.setAttribute('data-bs-theme', settings.theme);
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleThemeChange = () => {
        updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light');
    };

    // The context value now provides the settings and generic update functions
    const value = { settings, updateSetting, handleThemeChange };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};


// --- Reusable Components ---

const LocalStorageWarning = () => (
    <OverlayTrigger
        trigger="click" placement="top" rootClose
        overlay={
            <Tooltip id="local-storage-tooltip">
                This setting is saved directly in your browser. It is not synced with the database.
            </Tooltip>
        }
    >
        <span className="ms-2 text-warning" style={{ cursor: 'pointer' }}>
            <BsExclamationCircleFill />
        </span>
    </OverlayTrigger>
);

/**
 * A wrapper for a Form Group that automatically adds a local storage warning.
 */
const LocalSetting = ({ label, children, helpText, controlId }) => (
    <Form.Group as={Row} controlId={controlId} className="mb-3">
        <Form.Label column sm={4}>
            {label}
            <LocalStorageWarning />
        </Form.Label>
        <Col sm={8}>
            {children}
            {helpText && <Form.Text>{helpText}</Form.Text>}
        </Col>
    </Form.Group>
);

// --- Business Profile Component ---
// This component remains unchanged as it does not use local storage.
const BusinessProfile = ({ profile, setProfile }) => {

    const handleFieldChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));
    const handleFileChange = e => handleFieldChange('busLogo', e.target.files[0]);

    return (
        <Card>
            <Card.Header as="h5">Business Profile</Card.Header>
            <Card.Body><Stack gap={3}>
                <Form.Group as={Row} controlId="bus-name"><Form.Label column sm={4}>Business Name</Form.Label><Col sm={8}><Form.Control type="text" value={profile.busName} onChange={e => handleFieldChange('busName', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-location"><Form.Label column sm={4}>Location</Form.Label><Col sm={8}><Form.Control type="text" value={profile.busLocation} onChange={e => handleFieldChange('busLocation', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-building"><Form.Label column sm={4}>Building/Plaza</Form.Label><Col sm={8}><Form.Control type="text" value={profile.busBuilding} onChange={e => handleFieldChange('busBuilding', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-contact-one"><Form.Label column sm={4}>Primary Contact</Form.Label><Col sm={8}><Form.Control type="tel" value={profile.busContactOne} onChange={e => handleFieldChange('busContactOne', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-contact-two"><Form.Label column sm={4}>Secondary Contact</Form.Label><Col sm={8}><Form.Control type="tel" value={profile.busContactTwo} onChange={e => handleFieldChange('busContactTwo', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-email"><Form.Label column sm={4}>Business Email</Form.Label><Col sm={8}><Form.Control type="email" value={profile.busEmail} onChange={e => handleFieldChange('busEmail', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-owner"><Form.Label column sm={4}>Business Owner</Form.Label><Col sm={8}><Form.Control type="text" value={profile.busOwner} onChange={e => handleFieldChange('busOwner', e.target.value)} /></Col></Form.Group>
                <Form.Group as={Row} controlId="bus-logo"><Form.Label column sm={4}>Business Logo</Form.Label><Col sm={8}><Form.Control type="file" disabled onChange={handleFileChange} /></Col></Form.Group>
            </Stack></Card.Body>
        </Card>
    );
};


// --- Main Settings Page Component ---
const Settings = () => {
     const roles = useSelector(selectRoles);
     const isAllowed = roles?.includes("admin");
    const reduxProfile = useSelector(selectProfile);
    // Destructure what you need from the simplified context
    const { settings, updateSetting, handleThemeChange } = useSettings();
    // Destructure all settings for easier access in the JSX
    const {
        minWholesaleOrder, currency, autoPriceDetermination,
        lowLevelProducts, lowLevelMaterials, notificationFrequency,
        theme, navbarColor, sidebarColor
    } = settings;

    // --- State for Business Profile form ---
    const [profileUpdate, { isLoading }] = useUpdateProfileMutation();
    const [businessProfile, setBusinessProfile] = useState(reduxProfile);

    const handleSaveProfile = async () => {
        try {
            await profileUpdate({ businessProfile }).unwrap();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <Container className="py-4">
            <header className="mb-4">
                <h1>System Settings</h1>
                <p className="text-muted">Manage your business profile, orders, inventory, and interface preferences.</p>
            </header>

            <Stack gap={4}>
            
            {isAllowed?
<>
                <BusinessProfile profile={businessProfile} setProfile={setBusinessProfile} />

                <Card>
                    <Card.Header as="h5">Order & Financial</Card.Header>
                    <Card.Body><Stack gap={3}>
                        <LocalSetting label="Minimum Wholesale Order" controlId="min-wholesale" helpText="Set the minimum value to qualify for wholesale pricing.">
                            <Form.Control type="number" value={minWholesaleOrder} onChange={e => updateSetting('minWholesaleOrder', e.target.value)} />
                        </LocalSetting>
                        <LocalSetting label="Currency" controlId="currency">
                            <Form.Select value={currency} onChange={e => updateSetting('currency', e.target.value)}>
                                <option value="none">None</option>
                                <option value="USD">USD ($)</option>
                                <option value="UGX">UGX (USh)</option>
                            </Form.Select>
                        </LocalSetting>
                        <LocalSetting label="Automatic Price Determination" controlId="auto-price">
                            <Form.Check type="switch" checked={autoPriceDetermination} onChange={() => updateSetting('autoPriceDetermination', !autoPriceDetermination)} label="Automatically adjust selling price for wholesale orders." />
                        </LocalSetting>
                    </Stack></Card.Body>
                </Card>

                <Card>
                    <Card.Header as="h5">Inventory & Notifications</Card.Header>
                    <Card.Body><Stack gap={3}>
                        <LocalSetting label="Low Stock Threshold (Products)" controlId="low-stock-prod" helpText="Get notified when product stock falls below this level.">
                            <Form.Control type="number" value={lowLevelProducts} onChange={e => updateSetting('lowLevelProducts', e.target.value)} />
                        </LocalSetting>
                        <LocalSetting label="Low Stock Threshold (Raw Materials)" controlId="low-stock-mat" helpText="Get notified when material stock falls below this level.">
                            <Form.Control type="number" value={lowLevelMaterials} onChange={e => updateSetting('lowLevelMaterials', e.target.value)} />
                        </LocalSetting>
                        <LocalSetting label="Notification Frequency" controlId="notif-freq">
                            <Form.Select value={notificationFrequency} onChange={e => updateSetting('notificationFrequency', e.target.value)}>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Never</option>
                            </Form.Select>
                        </LocalSetting>
                    </Stack></Card.Body>
                </Card>

           </> :""}

                <Card>
                    <Card.Header as="h5">Appearance</Card.Header>
                    <Card.Body><Stack gap={3}>
                        <LocalSetting label="Theme" controlId="theme-toggle">
                            <Form.Check type="switch" checked={theme === 'dark'} onChange={handleThemeChange} label="Use Dark Mode" />
                        </LocalSetting>
                        <LocalSetting label="Navbar Background" controlId="navbar-color">
                            <Col sm={4}><Form.Control type="color" value={navbarColor} onChange={e => updateSetting('navbarColor', e.target.value)} /></Col>
                        </LocalSetting>
                        <LocalSetting label="Sidebar Background" controlId="sidebar-color">
                            <Col sm={4}><Form.Control type="color" value={sidebarColor} onChange={e => updateSetting('sidebarColor', e.target.value)} /></Col>
                        </LocalSetting>
                    </Stack></Card.Body>
                </Card>

                <Alert variant="info">
                    Settings with a <BsExclamationCircleFill className="text-warning mx-1" /> icon are saved automatically to your browser. Click the button below to save your <strong>Business Profile</strong> to the database.
                </Alert>

                <Stack direction="horizontal" gap={2} className="justify-content-end">
                    <Button variant="secondary">Cancel</Button>
                    <Button variant="primary" onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? 'Saving Profile...' : 'Save Business Profile'}
                    </Button>
                </Stack>
            </Stack>
        </Container>
    );
};

export default Settings;