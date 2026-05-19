document.addEventListener('DOMContentLoaded', function() {
    const currentUser = window.AppUser || {};
    const currentUserId = String(currentUser.userId || currentUser.id || 'guest');
    const storageKey = `profile-settings-${currentUserId}`;

    const fullNameInput = document.getElementById('profileFullName');
    const displayNameInput = document.getElementById('profileDisplayNameField');
    const dobInput = document.getElementById('profileDob');
    const genderSelect = document.getElementById('profileGender');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');
    const guardianContactInput = document.getElementById('profileGuardianContact');
    const fbNameInput = document.getElementById('profileFbName');
    const studentIdInput = document.getElementById('profileStudentId');
    const flagGroupInput = document.getElementById('profileFlagGroup');
    const roleInput = document.getElementById('profileRoleInput');
    const additionalCurriculumContent = document.getElementById('profileAdditionalCurriculumContent');
    const notificationsCheckbox = document.getElementById('profileNotifications');
    const themeSelect = document.getElementById('profileTheme');
    const currentPasswordInput = document.getElementById('profileCurrentPassword');
    const newPasswordInput = document.getElementById('profileNewPassword');
    const confirmPasswordInput = document.getElementById('profileConfirmPassword');
    const passwordFieldsContainer = document.getElementById('passwordFieldsContainer');
    const twoFactorValue = document.getElementById('profileTwoFactor');
    const profileLastLogin = document.getElementById('profileLastLogin');
    const profileCreatedOn = document.getElementById('profileCreatedOn');
    const profileLastUpdated = document.getElementById('profileLastUpdated');
    const changePasswordButton = document.getElementById('changePasswordButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const changePhotoButton = document.getElementById('changePhotoButton');
    const avatarEditOverlay = document.getElementById('avatarEditOverlay');
    const photoInput = document.getElementById('profilePhotoInput');
    const sendVerificationButton = document.getElementById('sendVerificationButton');
    const savePasswordButton = document.getElementById('savePasswordButton');
    const profileForm = document.getElementById('profileForm');
    const profileEditButton = document.getElementById('profileEditButton');
    const profileSaveButton = document.getElementById('profileSaveButton');
    const profileResetButton = document.getElementById('profileResetButton');
    const profileCancelButton = document.getElementById('profileCancelButton');
    const profileSaveMessage = document.getElementById('profileSaveMessage');
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileDisplayRole = document.getElementById('profileDisplayRole');
    const profileSectionBlocks = document.querySelectorAll('.profile-section-block');
    const studentOnlyFields = document.querySelectorAll('.student-only-field');
    const isStudentUser = String(currentUser.role || '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'student';
    const avatarImage = document.getElementById('profileAvatarImage');
    const avatarFallback = document.getElementById('profileAvatarFallback');

    const editableFields = [
        fullNameInput,
        displayNameInput,
        dobInput,
        genderSelect,
        phoneInput,
        addressInput,
        studentIdInput,
        flagGroupInput,
        notificationsCheckbox,
        themeSelect,
        currentPasswordInput,
        newPasswordInput,
        confirmPasswordInput
    ];

    let currentPhotoData = null;
    let isEditing = false;
    let isDirty = false;

    function loadProfileData() {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            return {};
        }

        try {
            return JSON.parse(saved) || {};
        } catch (error) {
            console.warn('Could not parse profile overrides', error);
            return {};
        }
    }

    function saveProfileData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    async function loadServerProfileData() {
        try {
            const response = await fetch('api/profile_data.php', {
                credentials: 'same-origin'
            });
            const data = await response.json();
            if (!data || !data.ok) return null;
            return data.profile || null;
        } catch (error) {
            console.warn('Could not fetch profile data from server', error);
            return null;
        }
    }

    function normalizeGenderValue(rawGender) {
        const gender = String(rawGender || '').trim().toLowerCase();
        if (gender === 'male') return 'male';
        if (gender === 'female') return 'female';
        if (gender === 'nonbinary' || gender === 'non-binary') return 'nonbinary';
        if (gender === 'prefer_not_to_say' || gender === 'prefer not to say') return 'prefer_not_to_say';
        return '';
    }

    function formatFlagGroup(rawFlagGroup) {
        const value = String(rawFlagGroup || '').trim().toLowerCase();
        if (!value) return '';
        const mapped = {
            faithfulness: 'Faithfulness',
            kindness: 'Kindness',
            peace: 'Peace',
            love: 'Love',
            self_control: 'Self Control',
            joy: 'Joy',
            greatfulness: 'Greatfulness',
            gentleness: 'Gentleness'
        };
        return mapped[value] || value;
    }

    function renderAdditionalCurriculum(assignments) {
        if (!additionalCurriculumContent) return;

        if (!Array.isArray(assignments) || assignments.length === 0) {
            additionalCurriculumContent.textContent = 'No additional curriculum assigned.';
            return;
        }

        additionalCurriculumContent.innerHTML = assignments.map(function (item) {
            var done = Number(item.is_completed || 0) === 1;
            var label = [item.subject_code, item.subject_name].filter(Boolean).join(' - ');
            var suffix = ' (Y' + (item.year_level || '-') + '/S' + (item.semester || '-') + ')';
            return '<div>' + (done ? 'Completed: ' : 'Pending: ') + label + suffix + '</div>';
        }).join('');
    }

    function getInitials(name) {
        if (!name) return 'U';
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word[0].toUpperCase())
            .join('') || 'U';
    }

    function setAvatar(photo, name) {
        const displayName = name || fullNameInput.value || currentUser.fullName || currentUser.name || 'User';
        avatarFallback.textContent = getInitials(displayName);

        if (photo) {
            avatarImage.src = photo;
            avatarImage.style.display = 'block';
            avatarFallback.style.display = 'none';
            avatarImage.setAttribute('aria-hidden', 'false');
        } else {
            avatarImage.removeAttribute('src');
            avatarImage.style.display = 'none';
            avatarFallback.style.display = 'flex';
            avatarImage.setAttribute('aria-hidden', 'true');
        }
    }

    function showMessage(message, success = true) {
        if (!profileSaveMessage) return;
        profileSaveMessage.textContent = message;
        profileSaveMessage.classList.toggle('success', success);
        profileSaveMessage.classList.toggle('error', !success);
        setTimeout(() => {
            profileSaveMessage.textContent = '';
            profileSaveMessage.classList.remove('success', 'error');
        }, 4000);
    }

    function readPhotoFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
        });
    }

    function setViewMode(viewMode) {
        isEditing = !viewMode;

        editableFields.forEach(field => {
            if (!field) return;
            if (field.type === 'checkbox' || field.tagName.toLowerCase() === 'select') {
                field.disabled = viewMode;
            } else {
                field.readOnly = viewMode;
            }
        });

        if (isStudentUser) {
            changePhotoButton.style.display = 'none';
            avatarEditOverlay.style.pointerEvents = 'none';
            avatarEditOverlay.style.opacity = '0.5';
            profileEditButton.style.display = 'none';
            profileResetButton.style.display = 'none';
            profileCancelButton.style.display = 'none';
            deleteAccountButton.style.display = 'none';
        } else {
            changePhotoButton.disabled = viewMode;
            avatarEditOverlay.style.pointerEvents = viewMode ? 'none' : 'auto';
            avatarEditOverlay.style.opacity = viewMode ? '0.5' : '1';
            profileEditButton.style.display = viewMode ? 'inline-flex' : 'none';
            profileResetButton.style.display = !viewMode ? 'inline-flex' : 'none';
            profileCancelButton.style.display = !viewMode ? 'inline-flex' : 'none';
        }

        profileSaveButton.style.display = !viewMode && isDirty ? 'inline-flex' : 'none';
        if (viewMode) {
            passwordFieldsContainer.style.display = 'none';
            changePasswordButton.textContent = 'Change Password';
            clearPasswordFields();
        } else {
            passwordFieldsContainer.style.display = 'none';
            changePasswordButton.textContent = 'Change Password';
        }
    }

    function setDirtyState(dirty) {
        isDirty = dirty;
        if (!isEditing) {
            profileSaveButton.style.display = 'none';
            return;
        }
        profileSaveButton.style.display = dirty ? 'inline-flex' : 'none';
    }

    function applyStudentViewRestrictions() {
        if (studentOnlyFields && studentOnlyFields.length) {
            studentOnlyFields.forEach(function (field) {
                field.style.display = isStudentUser ? '' : 'none';
            });
        }

        if (!isStudentUser || !profileSectionBlocks) return;

        profileSectionBlocks.forEach(function (block) {
            const heading = block.querySelector('.section-heading h4');
            if (!heading) return;
            const title = heading.textContent.trim();
            if (['Academic Information', 'Preferences', 'Profile History', 'Danger Zone'].includes(title)) {
                block.style.display = 'none';
            }
        });
    }

    async function initialize() {
        const overrides = loadProfileData();
        const serverProfile = await loadServerProfileData();

        // Always prefer server data for all users
        const initialName =
            (serverProfile ? serverProfile.full_name : '') ||
            overrides.fullName ||
            currentUser.fullName ||
            currentUser.name ||
            '';
        const initialDisplayName =
            (serverProfile ? serverProfile.full_name : '') ||
            overrides.displayName ||
            currentUser.displayName ||
            initialName ||
            '';
        const initialEmail =
            (serverProfile ? serverProfile.email : '') ||
            currentUser.email ||
            '';
        const initialRole =
            (serverProfile ? serverProfile.role : '') ||
            currentUser.role ||
            currentUser.userRole ||
            currentUser.roleName ||
            'User';

        fullNameInput.value = initialName;
        displayNameInput.value = initialDisplayName;
        dobInput.value =
            (serverProfile ? serverProfile.birth_date : '') ||
            overrides.dob ||
            currentUser.dob ||
            '';
        genderSelect.value = normalizeGenderValue(
            (serverProfile ? serverProfile.gender : '') || overrides.gender || currentUser.gender || ''
        );
        emailInput.value = initialEmail;
        phoneInput.value =
            (serverProfile ? serverProfile.phone : '') ||
            overrides.phone ||
            currentUser.phone ||
            '';
        addressInput.value =
            (serverProfile ? serverProfile.address : '') ||
            overrides.address ||
            currentUser.address ||
            '';
        if (guardianContactInput) {
            guardianContactInput.value = (serverProfile ? serverProfile.guardian_contact : '') || '';
        }
        if (fbNameInput) {
            fbNameInput.value = (serverProfile ? serverProfile.fb_name : '') || '';
        }
        studentIdInput.value =
            (serverProfile ? serverProfile.student_id : '') ||
            overrides.studentId ||
            currentUser.studentId ||
            currentUser.userId ||
            '';
        if (flagGroupInput) {
            flagGroupInput.value = String((serverProfile ? serverProfile.flag_group : '') || '').trim().toLowerCase();
        }
        renderAdditionalCurriculum((serverProfile && serverProfile.assigned_curriculum) ? serverProfile.assigned_curriculum : []);
        roleInput.value = initialRole;
        notificationsCheckbox.checked = overrides.notifications !== undefined ? !!overrides.notifications : true;
        themeSelect.value = overrides.theme || currentUser.theme || 'light';
        twoFactorValue.textContent = overrides.twoFactor || (currentUser.twoFactor ? 'Enabled' : 'Disabled');
        profileLastLogin.textContent =
            (serverProfile ? serverProfile.last_login : '') || overrides.lastLogin || currentUser.lastLogin || 'Never';
        profileCreatedOn.textContent =
            (serverProfile ? serverProfile.created_at : '') || overrides.createdOn || currentUser.createdOn || 'Not available';
        profileLastUpdated.textContent =
            (serverProfile ? serverProfile.updated_at : '') || overrides.lastUpdated || currentUser.lastUpdated || 'Not available';

        currentPhotoData = (serverProfile ? serverProfile.profile_photo : null) || overrides.photo || currentUser.photo || null;
        setAvatar(currentPhotoData, initialName);

        profileDisplayName.textContent = initialDisplayName || 'Your Name';
        profileDisplayRole.textContent = initialRole;

        setViewMode(true);
        setDirtyState(false);
        applyStudentViewRestrictions();

        if (isStudentUser) {
            if (profileEditButton) profileEditButton.style.display = 'none';
            if (changePhotoButton) changePhotoButton.style.display = 'none';
            if (avatarEditOverlay) avatarEditOverlay.style.display = 'none';
        }
    }

    function handlePhotoUpload() {
        photoInput.click();
    }

    async function handlePhotoChange(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            showMessage('Please select a valid image file.', false);
            return;
        }

        try {
            currentPhotoData = await readPhotoFile(file);
            setAvatar(currentPhotoData, fullNameInput.value);
            showMessage('Profile photo ready to save.');
            if (isEditing) {
                setDirtyState(true);
            }
        } catch (error) {
            console.error(error);
            showMessage('Unable to read the selected image.', false);
        }
    }

    function collectProfileData() {
        return {
            fullName: fullNameInput.value.trim(),
            displayName: displayNameInput.value.trim(),
            dob: dobInput.value,
            gender: genderSelect.value,
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim(),
            studentId: studentIdInput.value.trim(),
            theme: themeSelect.value,
            notifications: notificationsCheckbox.checked,
            twoFactor: twoFactorValue.textContent,
            photo: currentPhotoData || null
        };
    }

    function updateSessionProfile(storedData) {
        if (typeof window === 'undefined') return;

        const existingAppUser = window.AppUser || {};
        const updatedUser = {
            ...existingAppUser,
            fullName: storedData.fullName,
            name: storedData.fullName,
            displayName: storedData.displayName || storedData.fullName,
            dob: storedData.dob,
            gender: storedData.gender,
            phone: storedData.phone,
            address: storedData.address,
            studentId: storedData.studentId || existingAppUser.studentId || existingAppUser.userId || existingAppUser.id || '',
            profile_photo: storedData.photo || existingAppUser.profile_photo || existingAppUser.photo || null,
            photo: storedData.photo || existingAppUser.photo || existingAppUser.profile_photo || null
        };

        window.AppUser = updatedUser;

        if (window.SharedData) {
            window.SharedData.currentUser = updatedUser;
            window.SharedData.currentUserName = String(updatedUser.fullName || updatedUser.displayName || updatedUser.name || '').trim();
            window.SharedData.currentUserId = updatedUser.userId || updatedUser.id || updatedUser.studentId || null;
        }

        try {
            window.dispatchEvent(new CustomEvent('appUserUpdated', { detail: updatedUser }));
        } catch (error) {
            console.warn('Failed to dispatch profile update event', error);
        }
    }

    function clearPasswordFields() {
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (isStudentUser && passwordFieldsContainer.style.display === 'block') {
            await submitPasswordChange();
            return;
        }

        if (!isEditing) {
            return;
        }

        const fullName = fullNameInput.value.trim();
        if (!fullName) {
            showMessage('Full name is required.', false);
            fullNameInput.focus();
            return;
        }

        if (passwordFieldsContainer.style.display === 'block') {
            const currentPassword = currentPasswordInput.value.trim();
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            if (!currentPassword || !newPassword || !confirmPassword) {
                showMessage('Please fill in all password fields or hide the password section.', false);
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage('New password and confirmation do not match.', false);
                return;
            }

            showMessage('Password updated successfully.');
            clearPasswordFields();
            passwordFieldsContainer.style.display = 'none';
            changePasswordButton.textContent = 'Change Password';
        }

        const storedData = collectProfileData();

        // Save to server
        try {
            const normalizedGender = genderSelect.value || '';
            const genderMap = { male: 'Male', female: 'Female', nonbinary: 'Non-Binary', prefer_not_to_say: 'Prefer not to say' };
            const serverPayload = {
                full_name: fullName,
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim(),
                birth_date: dobInput.value || '',
                gender: genderMap[normalizedGender] || normalizedGender,
                profile_photo: currentPhotoData || ''
            };
            const saveRes = await fetch('api/profile_save.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverPayload)
            });
            const saveData = await saveRes.json();
            if (!saveData.ok) {
                showMessage(saveData.error || 'Failed to save profile to server.', false);
                return;
            }
        } catch (err) {
            console.error('Profile save error:', err);
            showMessage('Failed to save profile to server.', false);
            return;
        }

        // Also keep localStorage for preferences (theme, notifications)
        saveProfileData(storedData);
        updateSessionProfile(storedData);
        profileDisplayName.textContent = storedData.displayName || storedData.fullName;
        profileDisplayRole.textContent = roleInput.value || 'User';
        showMessage('Profile saved successfully.');
        setDirtyState(false);
        setViewMode(true);
    }

    async function submitPasswordChange() {
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Please fill in all password fields.', false);
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('New password and confirmation do not match.', false);
            return;
        }

        try {
            const response = await fetch('api/change_password.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });
            const data = await response.json();
            if (!data.ok) {
                showMessage(data.error || 'Unable to change password', false);
                return;
            }
            showMessage(data.message || 'Password changed successfully');
            clearPasswordFields();
            passwordFieldsContainer.style.display = 'none';
            changePasswordButton.textContent = 'Change Password';
        } catch (error) {
            console.error('Password change error:', error);
            showMessage('Password change request failed', false);
        }
    }

    function handleReset() {
        initialize();
        showMessage('Profile fields reset.', true);
    }

    function handleCancel() {
        initialize();
        showMessage('Edit canceled.', true);
    }

    function handleInputChange() {
        if (isEditing) {
            setDirtyState(true);
        }
    }

    function handlePasswordClick() {
        const isVisible = passwordFieldsContainer.style.display === 'block';
        if (isVisible) {
            passwordFieldsContainer.style.display = 'none';
            changePasswordButton.textContent = 'Change Password';
            clearPasswordFields();
            if (isStudentUser) {
                currentPasswordInput.readOnly = true;
                newPasswordInput.readOnly = true;
                confirmPasswordInput.readOnly = true;
            }
        } else {
            passwordFieldsContainer.style.display = 'block';
            changePasswordButton.textContent = 'Hide Password Fields';
            if (isStudentUser) {
                currentPasswordInput.readOnly = false;
                newPasswordInput.readOnly = false;
                confirmPasswordInput.readOnly = false;
            } else if (!isEditing) {
                setViewMode(false);
                setDirtyState(true);
            }
        }
    }

    function handleDeactivateClick() {
        showMessage('Account deactivation is not enabled in this sample.', false);
    }

    function openGmailVerificationDraft(email, code) {
        const subject = encodeURIComponent('Verification Code');
        const body = encodeURIComponent(
            `Hello,%0A%0AYour verification code is: ${code}%0A%0A` +
            'If you did not request this code, please ignore this message.%0A'
        );
        const gmailUrl =
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}` +
            `&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
    }

    async function handleSendVerification() {
        try {
            const response = await fetch('api/send_verification_code.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (!data.ok) {
                showMessage(data.error || 'Unable to send verification code', false);
                return;
            }
            if (data.gmail_compose && data.code) {
                const recipient = window.AppUser && window.AppUser.email ? window.AppUser.email : '';
                openGmailVerificationDraft(recipient, data.code);
                showMessage('Gmail draft opened. Send the message to complete verification.', true);
                return;
            }
            showMessage(data.message || 'Verification code sent to your email');
        } catch (error) {
            console.error('Verification code error:', error);
            showMessage('Verification code request failed', false);
        }
    }

    if (!profileForm || !profileSaveButton || !profileResetButton || !profileCancelButton) {
        return;
    }

    initialize();

    window.addEventListener('appUserUpdated', function () {
        if (isEditing) {
            return;
        }
        initialize();
    });

    changePhotoButton && changePhotoButton.addEventListener('click', handlePhotoUpload);
    avatarEditOverlay && avatarEditOverlay.addEventListener('click', handlePhotoUpload);
    photoInput && photoInput.addEventListener('change', handlePhotoChange);
    editableFields.forEach(field => {
        if (!field) return;
        const eventName = field.type === 'checkbox' || field.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        field.addEventListener(eventName, handleInputChange);
    });
    profileForm.addEventListener('submit', handleFormSubmit);
    if (profileEditButton) {
        profileEditButton.addEventListener('click', function() {
            setViewMode(false);
            setDirtyState(true);
        });
    }
    profileResetButton.addEventListener('click', handleReset);
    profileCancelButton.addEventListener('click', handleCancel);
    changePasswordButton && changePasswordButton.addEventListener('click', handlePasswordClick);
    savePasswordButton && savePasswordButton.addEventListener('click', submitPasswordChange);
    sendVerificationButton && sendVerificationButton.addEventListener('click', handleSendVerification);
    deleteAccountButton && deleteAccountButton.addEventListener('click', handleDeactivateClick);
});
