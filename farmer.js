// farmer.js - USSD Farmer Interface Logic with Full Profile Updates

// State management
let currentScreen = 'idle'; // 'idle', 'dial', 'menu'
let typedCode = '';
let menuState = 'main';
let selectedCrops = [];
let optionBuffer = '';
let profileState = 'view';
let pendingOption = ''; // Store the option until CALL is pressed

// DOM elements - will be initialized after DOM loads
let idleScreen, dialScreen, menuScreen, typedNumber, menuContent, menuFooter;
let callBtn, clearBtn, homeBtn, backBtn, keys;

// Target USSD code
const USSD_CODE = '*6770#';

// Farmer profile data (this would come from backend in real app)
let farmerProfile = {
    district: 'Kabale',
    crops: ['Beans', 'Irish Potatoes', 'Maize'],
    phone: '+256 78X XXX XXX',
    registeredDate: '2024-01-15',
    feedbackScore: 85
};

// Temporary profile data for updates
let tempProfileData = {
    district: 'Kabale',
    crops: ['Beans', 'Irish Potatoes', 'Maize'],
    phone: '+256 78X XXX XXX'
};

// All available districts by region
const districtsByRegion = {
    central: ['Kampala', 'Wakiso', 'Mukono', 'Mpigi', 'Masaka', 'Kalungu', 'Bukomansimbi', 'Buvuma', 'Buikwe', 'Luwero'],
    eastern: ['Mbale', 'Kapchorwa', 'Kween', 'Bulambuli', 'Namisindwa', 'Sironko', 'Tororo', 'Busia', 'Bugiri'],
    northern: ['Gulu', 'Lira', 'Pader', 'Kitgum', 'Lamwo', 'Agago', 'Apac', 'Kole', 'Alebtong', 'Otuke'],
    western: ['Kabale', 'Kisoro', 'Kanungu', 'Rukungiri', 'Ntungamo', 'Mbarara', 'Bushenyi', 'Kasese', 'Bundibugyo'],
    karamoja: ['Moroto', 'Kotido', 'Nakapiripirit', 'Amudat', 'Kaabong', 'Karenga', 'Napak'],
    westnile: ['Arua', 'Maracha', 'Koboko', 'Yumbe', 'Moyo', 'Adjumani', 'Nebbi', 'Pakwach']
};

// All available crops
const allCrops = [
    'Beans', 'Irish Potatoes', 'Maize', 'Sorghum', 'Coffee', 'Cassava',
    'Sesame', 'Groundnuts', 'Banana', 'Sweet Potatoes', 'Millet', 'Field Peas'
];

// Menu definitions
const menus = {
    main: {
        title: 'Climate-Smart Planting',
        options: [
            { number: '1', text: 'Register' },
            { number: '2', text: 'Get Advice' },
            { number: '3', text: 'My Profile' },
            { number: '4', text: 'Report Problem' },
            { number: '0', text: 'Exit' }
        ]
    },
    registerRegion: {
        title: 'Select Region',
        options: [
            { number: '1', text: 'Central (Kampala area)' },
            { number: '2', text: 'Eastern (Mbale, Tororo)' },
            { number: '3', text: 'Northern (Gulu, Lira)' },
            { number: '4', text: 'Western (Mbarara, Kabale)' },
            { number: '5', text: 'Karamoja' },
            { number: '6', text: 'West Nile' },
            { number: '0', text: 'Back' }
        ]
    },
    registerDistrict: {
        title: 'Select District',
        options: [] // Will be populated dynamically
    },
    registerCrops: {
        title: 'Select Crops (Max 3)',
        options: [] // Will be populated dynamically
    },
    advice: {
        title: 'Select Crop for Advice',
        options: [
            { number: '1', text: 'Beans' },
            { number: '2', text: 'Irish Potatoes' },
            { number: '3', text: 'Maize' },
            { number: '4', text: 'Coffee' },
            { number: '5', text: 'Cassava' },
            { number: '0', text: 'Back' }
        ]
    },
    adviceResult: {
        title: '🌽 Maize Advice',
        message: 'Plant in 2 weeks. Soil too dry.\nCurrent soil moisture: 15%\nAlternative: Sesame can be planted now.',
        options: [
            { number: '#', text: 'Continue' },
            { number: '0', text: 'Main Menu' }
        ]
    },
    profile: {
        title: '👤 Your Profile',
        message: `District: ${farmerProfile.district}\nCrops: ${farmerProfile.crops.join(', ')}\nLast alert: Today 6:30 AM\nFeedback score: ${farmerProfile.feedbackScore}%`,
        options: [
            { number: '1', text: '✎ Update Crops' },
            { number: '2', text: '✎ Update District' },
            { number: '3', text: 'View Alert History' },
            { number: '0', text: 'Back' }
        ]
    },
    updateCrops: {
        title: '🌱 Update Your Crops',
        message: `Current crops: ${farmerProfile.crops.join(', ')}\nSelect crops to update (max 3)`,
        options: [] // Will be populated dynamically
    },
    updateDistrict: {
        title: '📍 Update Your District',
        message: `Current district: ${farmerProfile.district}\nSelect new district:`,
        options: [] // Will be populated dynamically
    },
    updateDistrictRegion: {
        title: 'Select Region for New District',
        options: [
            { number: '1', text: 'Central' },
            { number: '2', text: 'Eastern' },
            { number: '3', text: 'Northern' },
            { number: '4', text: 'Western' },
            { number: '5', text: 'Karamoja' },
            { number: '6', text: 'West Nile' },
            { number: '0', text: 'Back to Profile' }
        ]
    },
    alertHistory: {
        title: '📋 Alert History',
        message: 'Last 5 alerts:\n• Today 6:30AM: Plant potatoes\n• Yesterday 6:30AM: Heavy rain warning\n• Jan 20: Maize planting advice\n• Jan 15: Dry spell alert\n• Jan 10: Registration confirmed',
        options: [
            { number: '0', text: 'Back to Profile' }
        ]
    },
    confirmation: {
        title: '✅ Registration Complete',
        message: `Registered for ${farmerProfile.district} with:\n• ${farmerProfile.crops.join('\n• ')}\n\nYou will receive alerts soon.`,
        options: [
            { number: '#', text: 'OK' },
            { number: '0', text: 'Main Menu' }
        ]
    },
    updateSuccess: {
        title: '✅ Update Successful',
        message: 'Your profile has been updated!',
        options: [
            { number: '#', text: 'OK' },
            { number: '0', text: 'Main Menu' }
        ]
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Get DOM elements
    idleScreen = document.getElementById('idleScreen');
    dialScreen = document.getElementById('dialScreen');
    menuScreen = document.getElementById('menuScreen');
    typedNumber = document.getElementById('typedNumber');
    menuContent = document.getElementById('menuContent');
    menuFooter = document.getElementById('menuFooter');
    callBtn = document.getElementById('callBtn');
    clearBtn = document.getElementById('clearBtn');
    homeBtn = document.getElementById('homeBtn');
    backBtn = document.getElementById('backBtn');
    keys = document.querySelectorAll('.key[data-value]');

    // Initialize temp profile with farmer profile
    tempProfileData = {
        district: farmerProfile.district,
        crops: [...farmerProfile.crops],
        phone: farmerProfile.phone
    };

    // Initialize event listeners
    initEventListeners();
    
    // Initialize the app
    resetToHome();
    
    console.log('App initialized successfully');
});

// Initialize all event listeners
function initEventListeners() {
    console.log('Initializing event listeners...');
    
    // Keypad buttons
    keys.forEach(key => {
        key.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            console.log('Key pressed:', value);
            handleKeyPress(value);
        });
    });

    // Call button
    if (callBtn) {
        callBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Call button clicked');
            handleCallButton();
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clear button clicked');
            handleClearButton();
        });
    }

    // Home button
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Home button clicked');
            resetToHome();
        });
    }

    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked');
            handleBackButton();
        });
    }

    // Add keyboard support for testing
    document.addEventListener('keydown', handleKeyboardInput);
}

// ========== HANDLER FUNCTIONS ==========

function handleKeyPress(value) {
    console.log('handleKeyPress:', value, 'currentScreen:', currentScreen);
    
    if (currentScreen === 'idle') {
        // Switch to dial screen when any key is pressed
        showScreen('dial');
        typedCode = value;
        typedNumber.textContent = typedCode;
    } 
    else if (currentScreen === 'dial') {
        // Add to typed code
        typedCode += value;
        typedNumber.textContent = typedCode;
    }
    else if (currentScreen === 'menu') {
        // In menu, add to pending option (don't process yet)
        pendingOption += value;
        
        // Show what they've typed so far
        showTemporaryMessage(`Selected: ${pendingOption} - Press CALL to continue`, 'info');
        
        // Update footer to show pending option
        updateMenuFooterWithPending();
    }
}

function handleCallButton() {
    console.log('handleCallButton - currentScreen:', currentScreen, 'typedCode:', typedCode, 'pendingOption:', pendingOption);
    
    if (currentScreen === 'dial') {
        // On dial screen - check if it's the USSD code
        if (typedCode === USSD_CODE) {
            showMenu();
        } else {
            showTemporaryMessage('Invalid USSD code. Please dial *6770#', 'error');
            showScreen('idle');
            typedCode = '';
        }
    } 
    else if (currentScreen === 'menu') {
        // On menu screen - submit the pending option
        if (pendingOption) {
            // Process the option
            processMenuOption(pendingOption);
            pendingOption = ''; // Clear after processing
            updateMenuFooter(); // Reset footer
        } else {
            showTemporaryMessage('Please type an option first', 'warning');
        }
    }
    else if (currentScreen === 'idle') {
        // If on idle screen, prepare for dialing
        showScreen('dial');
        typedCode = '';
        typedNumber.textContent = '';
    }
}

function handleClearButton() {
    console.log('handleClearButton - currentScreen:', currentScreen);
    
    if (currentScreen === 'dial') {
        if (typedCode.length > 0) {
            typedCode = typedCode.slice(0, -1);
            typedNumber.textContent = typedCode;
            
            if (typedCode === '') {
                showScreen('idle');
            }
        } else {
            showScreen('idle');
        }
    } else if (currentScreen === 'menu') {
        // Clear pending option or go back
        if (pendingOption) {
            pendingOption = '';
            showTemporaryMessage('Option cleared', 'info');
            updateMenuFooter();
        } else {
            handleBack();
        }
    } else {
        resetToHome();
    }
}

function handleBackButton() {
    console.log('handleBackButton - currentScreen:', currentScreen);
    
    if (currentScreen === 'menu') {
        if (pendingOption) {
            // If there's a pending option, clear it first
            pendingOption = '';
            showTemporaryMessage('Option cleared', 'info');
            updateMenuFooter();
        } else {
            handleBack();
        }
    } else {
        resetToHome();
    }
}

function processMenuOption(option) {
    if (!option) return;
    
    console.log('Processing menu option:', option, 'menuState:', menuState);
    
    switch(menuState) {
        case 'main':
            if (option === '1') {
                menuState = 'registerRegion';
            } else if (option === '2') {
                menuState = 'advice';
            } else if (option === '3') {
                menuState = 'profile';
                // Update profile message with current data
                menus.profile.message = `District: ${farmerProfile.district}\nCrops: ${farmerProfile.crops.join(', ')}\nLast alert: Today 6:30 AM\nFeedback score: ${farmerProfile.feedbackScore}%`;
            } else if (option === '4') {
                menuState = 'report';
                showTemporaryMessage('Report feature coming soon', 'info');
                menuState = 'main';
            } else if (option === '0') {
                resetToHome();
                return;
            }
            break;
            
        case 'registerRegion':
            handleRegionSelection(option);
            break;
            
        case 'registerDistrict':
            handleDistrictSelection(option);
            break;
            
        case 'registerCrops':
            handleCropSelection(option);
            break;
            
        case 'advice':
            if (option === '3') {
                menuState = 'adviceResult';
            } else if (option === '0') {
                menuState = 'main';
            } else {
                showTemporaryMessage('Option not available', 'warning');
                return;
            }
            break;
            
        case 'adviceResult':
            if (option === '0') {
                menuState = 'main';
            } else if (option === '#') {
                menuState = 'advice';
            } else {
                showTemporaryMessage('Option not available', 'warning');
                return;
            }
            break;
            
        case 'profile':
            handleProfileOptions(option);
            break;
            
        case 'updateCrops':
            handleUpdateCrops(option);
            break;
            
        case 'updateDistrictRegion':
            handleUpdateDistrictRegion(option);
            break;
            
        case 'updateDistrict':
            handleUpdateDistrict(option);
            break;
            
        case 'alertHistory':
            if (option === '0') {
                menuState = 'profile';
            }
            break;
            
        case 'confirmation':
            if (option === '0' || option === '#') {
                menuState = 'main';
            }
            break;
            
        case 'updateSuccess':
            if (option === '0' || option === '#') {
                menuState = 'main';
            }
            break;
    }
    
    updateMenuDisplay();
}

// ========== REGISTRATION HANDLERS ==========

function handleRegionSelection(option) {
    let region = '';
    
    if (option === '1') region = 'central';
    else if (option === '2') region = 'eastern';
    else if (option === '3') region = 'northern';
    else if (option === '4') region = 'western';
    else if (option === '5') region = 'karamoja';
    else if (option === '6') region = 'westnile';
    else if (option === '0') {
        menuState = 'main';
        return;
    } else {
        showTemporaryMessage('Option not available', 'warning');
        return;
    }
    
    // Populate district options for selected region
    const districts = districtsByRegion[region];
    menus.registerDistrict.options = districts.map((district, index) => ({
        number: (index + 1).toString(),
        text: district
    }));
    menus.registerDistrict.options.push({ number: '0', text: 'Back' });
    
    // Update title to show region
    menus.registerDistrict.title = `Select District - ${region.charAt(0).toUpperCase() + region.slice(1)}`;
    
    menuState = 'registerDistrict';
}

function handleDistrictSelection(option) {
    if (option === '0') {
        menuState = 'registerRegion';
        return;
    }
    
    const districtIndex = parseInt(option) - 1;
    const districts = menus.registerDistrict.options.filter(opt => opt.number !== '0');
    
    if (districtIndex >= 0 && districtIndex < districts.length) {
        const selectedDistrict = districts[districtIndex].text;
        tempProfileData.district = selectedDistrict;
        
        // Populate crop options
        menus.registerCrops.options = allCrops.map((crop, index) => ({
            number: (index + 1).toString(),
            text: crop
        }));
        menus.registerCrops.options.push({ number: '0', text: 'Back' });
        
        menuState = 'registerCrops';
        selectedCrops = []; // Reset selected crops for new registration
    } else {
        showTemporaryMessage('Invalid option', 'warning');
    }
}

function handleCropSelection(option) {
    if (option === '0') {
        menuState = 'registerDistrict';
        return;
    }
    
    if (option === '6') { // Confirm
        if (selectedCrops.length > 0) {
            // Save to farmer profile
            farmerProfile.district = tempProfileData.district;
            farmerProfile.crops = [...selectedCrops];
            
            // Update confirmation message
            menus.confirmation.message = `Registered for ${farmerProfile.district} with:\n• ${farmerProfile.crops.join('\n• ')}\n\nYou will receive alerts soon.`;
            
            menuState = 'confirmation';
        } else {
            showTemporaryMessage('Select at least one crop', 'warning');
        }
        return;
    }
    
    const cropIndex = parseInt(option) - 1;
    const crops = allCrops;
    
    if (cropIndex >= 0 && cropIndex < crops.length) {
        const selectedCrop = crops[cropIndex];
        
        if (selectedCrops.includes(selectedCrop)) {
            selectedCrops = selectedCrops.filter(c => c !== selectedCrop);
            showTemporaryMessage(`Removed ${selectedCrop}`, 'info');
        } else if (selectedCrops.length < 3) {
            selectedCrops.push(selectedCrop);
            showTemporaryMessage(`Added ${selectedCrop} (${selectedCrops.length}/3)`, 'success');
        } else {
            showTemporaryMessage('Maximum 3 crops allowed!', 'warning');
        }
    } else {
        showTemporaryMessage('Invalid option', 'warning');
    }
}

// ========== PROFILE UPDATE HANDLERS ==========

function handleProfileOptions(option) {
    if (option === '1') {
        // Update Crops
        menuState = 'updateCrops';
        
        // Populate crop options with current selections
        menus.updateCrops.options = allCrops.map((crop, index) => {
            const isSelected = farmerProfile.crops.includes(crop);
            return {
                number: (index + 1).toString(),
                text: isSelected ? `✓ ${crop} (current)` : crop
            };
        });
        menus.updateCrops.options.push(
            { number: '7', text: '✅ Confirm Changes' },
            { number: '0', text: '← Cancel' }
        );
        
        // Initialize temp crops with current farmer crops
        tempProfileData.crops = [...farmerProfile.crops];
        
    } else if (option === '2') {
        // Update District - show region selection first
        menuState = 'updateDistrictRegion';
        
    } else if (option === '3') {
        // View Alert History
        menuState = 'alertHistory';
        
    } else if (option === '0') {
        menuState = 'main';
    } else {
        showTemporaryMessage('Option not available', 'warning');
    }
}

function handleUpdateCrops(option) {
    if (option === '0') {
        // Cancel - go back to profile
        menuState = 'profile';
        return;
    }
    
    if (option === '7') {
        // Confirm changes
        if (tempProfileData.crops.length > 0) {
            // Update farmer profile
            farmerProfile.crops = [...tempProfileData.crops];
            
            // Update profile message
            menus.profile.message = `District: ${farmerProfile.district}\nCrops: ${farmerProfile.crops.join(', ')}\nLast alert: Today 6:30 AM\nFeedback score: ${farmerProfile.feedbackScore}%`;
            
            // Show success message
            menus.updateSuccess.message = `Crops updated successfully!\nNew crops: ${farmerProfile.crops.join(', ')}`;
            menuState = 'updateSuccess';
        } else {
            showTemporaryMessage('Select at least one crop', 'warning');
        }
        return;
    }
    
    const cropIndex = parseInt(option) - 1;
    
    if (cropIndex >= 0 && cropIndex < allCrops.length) {
        const selectedCrop = allCrops[cropIndex];
        
        if (tempProfileData.crops.includes(selectedCrop)) {
            // Remove crop
            tempProfileData.crops = tempProfileData.crops.filter(c => c !== selectedCrop);
            showTemporaryMessage(`Removed ${selectedCrop}`, 'info');
        } else if (tempProfileData.crops.length < 3) {
            // Add crop
            tempProfileData.crops.push(selectedCrop);
            showTemporaryMessage(`Added ${selectedCrop} (${tempProfileData.crops.length}/3)`, 'success');
        } else {
            showTemporaryMessage('Maximum 3 crops allowed!', 'warning');
        }
    }
    
    // Refresh the crop options with updated selections
    menus.updateCrops.options = allCrops.map((crop, index) => {
        const isSelected = tempProfileData.crops.includes(crop);
        return {
            number: (index + 1).toString(),
            text: isSelected ? `✓ ${crop}` : crop
        };
    });
    menus.updateCrops.options.push(
        { number: '7', text: '✅ Confirm Changes' },
        { number: '0', text: '← Cancel' }
    );
}

function handleUpdateDistrictRegion(option) {
    let region = '';
    
    if (option === '1') region = 'central';
    else if (option === '2') region = 'eastern';
    else if (option === '3') region = 'northern';
    else if (option === '4') region = 'western';
    else if (option === '5') region = 'karamoja';
    else if (option === '6') region = 'westnile';
    else if (option === '0') {
        menuState = 'profile';
        return;
    } else {
        showTemporaryMessage('Option not available', 'warning');
        return;
    }
    
    // Populate district options for selected region
    const districts = districtsByRegion[region];
    menus.updateDistrict.options = districts.map((district, index) => ({
        number: (index + 1).toString(),
        text: district === farmerProfile.district ? `✓ ${district} (current)` : district
    }));
    menus.updateDistrict.options.push({ number: '0', text: '← Cancel' });
    
    menus.updateDistrict.title = `Select New District - ${region.charAt(0).toUpperCase() + region.slice(1)}`;
    menus.updateDistrict.message = `Current district: ${farmerProfile.district}`;
    
    menuState = 'updateDistrict';
}

function handleUpdateDistrict(option) {
    if (option === '0') {
        menuState = 'updateDistrictRegion';
        return;
    }
    
    const districtIndex = parseInt(option) - 1;
    const districts = menus.updateDistrict.options.filter(opt => opt.number !== '0');
    
    if (districtIndex >= 0 && districtIndex < districts.length) {
        const newDistrict = districts[districtIndex].text.replace('✓ ', '').replace(' (current)', '');
        
        // Update farmer profile
        farmerProfile.district = newDistrict;
        
        // Update profile message
        menus.profile.message = `District: ${farmerProfile.district}\nCrops: ${farmerProfile.crops.join(', ')}\nLast alert: Today 6:30 AM\nFeedback score: ${farmerProfile.feedbackScore}%`;
        
        // Show success message
        menus.updateSuccess.message = `District updated successfully!\nNew district: ${farmerProfile.district}`;
        menuState = 'updateSuccess';
    } else {
        showTemporaryMessage('Invalid option', 'warning');
    }
}

// ========== UI FUNCTIONS ==========

function showMenu() {
    console.log('Showing menu');
    currentScreen = 'menu';
    idleScreen.classList.add('hidden');
    dialScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    menuState = 'main';
    selectedCrops = [];
    pendingOption = '';
    updateMenuDisplay();
}

function updateMenuDisplay() {
    const menu = menus[menuState];
    if (!menu) return;

    let html = `<div class="menu-view">`;
    
    if (menu.title) {
        html += `<div class="menu-view-title">${menu.title}</div>`;
    }
    
    if (menu.message) {
        html += `<div class="menu-view-message">${menu.message.replace(/\n/g, '<br>')}</div>`;
    }
    
    if (menu.options) {
        html += `<div class="menu-view-options">`;
        menu.options.forEach(opt => {
            html += `<div class="menu-view-option" data-option="${opt.number}">
                <span class="option-number">${opt.number}</span> ${opt.text}
            </div>`;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    menuContent.innerHTML = html;
    
    // Update footer
    updateMenuFooter();
}

function updateMenuFooter() {
    if (!menuFooter) return;
    
    let backHint = '0 Back';
    if (menuState === 'main') {
        backHint = '0 Exit';
    }
    
    menuFooter.innerHTML = `
        <span><i class="fas fa-arrow-left"></i> ${backHint}</span>
        <span><i class="fas fa-home"></i> Home</span>
        <span>CALL <i class="fas fa-phone-alt"></i> Send</span>
    `;
}

function updateMenuFooterWithPending() {
    if (!menuFooter) return;
    
    menuFooter.innerHTML = `
        <span><i class="fas fa-arrow-left"></i> CLEAR</span>
        <span>Option: ${pendingOption}</span>
        <span>CALL <i class="fas fa-phone-alt"></i> Send</span>
    `;
}

function showScreen(screen) {
    console.log('Showing screen:', screen);
    currentScreen = screen;
    idleScreen.classList.add('hidden');
    dialScreen.classList.add('hidden');
    menuScreen.classList.add('hidden');

    if (screen === 'idle') {
        idleScreen.classList.remove('hidden');
        typedCode = '';
        typedNumber.textContent = '';
        pendingOption = '';
    } else if (screen === 'dial') {
        dialScreen.classList.remove('hidden');
    } else if (screen === 'menu') {
        menuScreen.classList.remove('hidden');
    }
}

function handleBack() {
    console.log('handleBack - menuState:', menuState);
    
    switch(menuState) {
        case 'registerRegion':
            menuState = 'main';
            break;
        case 'registerDistrict':
            menuState = 'registerRegion';
            break;
        case 'registerCrops':
            menuState = 'registerDistrict';
            break;
        case 'advice':
        case 'profile':
            menuState = 'main';
            break;
        case 'updateCrops':
        case 'updateDistrictRegion':
            menuState = 'profile';
            break;
        case 'updateDistrict':
            menuState = 'updateDistrictRegion';
            break;
        case 'alertHistory':
            menuState = 'profile';
            break;
        case 'adviceResult':
            menuState = 'advice';
            break;
        case 'confirmation':
        case 'updateSuccess':
            menuState = 'main';
            selectedCrops = [];
            break;
        default:
            showScreen('idle');
            return;
    }
    updateMenuDisplay();
}

function resetToHome() {
    console.log('Resetting to home');
    showScreen('idle');
    typedCode = '';
    menuState = 'main';
    selectedCrops = [];
    pendingOption = '';
    
    // Reset temp profile to match farmer profile
    tempProfileData = {
        district: farmerProfile.district,
        crops: [...farmerProfile.crops],
        phone: farmerProfile.phone
    };
}

function showTemporaryMessage(msg, type = 'success') {
    const colors = {
        success: '#27ae60',
        error: '#c0392b',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = msg;
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: fadeOut 2s ease forwards;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 2000);
}

function handleKeyboardInput(e) {
    const key = e.key;
    console.log('Keyboard key:', key);
    
    if (key >= '0' && key <= '9') {
        handleKeyPress(key);
    } else if (key === '*') {
        handleKeyPress('*');
    } else if (key === '#') {
        handleKeyPress('#');
    } else if (key === 'Backspace') {
        handleClearButton();
    } else if (key === 'Enter') {
        handleCallButton();
    } else if (key === 'Escape') {
        resetToHome();
    }
}