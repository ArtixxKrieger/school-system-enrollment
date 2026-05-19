<div class="profile-page">
    <div class="profile-page-grid">
        <div class="profile-card profile-edit-card">
            <div class="profile-avatar profile-avatar-edit" id="profileAvatarPreview">
                <img id="profileAvatarImage" alt="Profile photo">
                <div class="profile-avatar-fallback" id="profileAvatarFallback"></div>
                <div class="avatar-edit-overlay" id="avatarEditOverlay" title="Upload a new profile photo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                </div>
            </div>
            <div class="profile-edit-details">
                <h3 id="profileDisplayName">Your Name</h3>
                <p id="profileDisplayRole">User Role</p>
                <div class="profile-card-actions">
                    <button type="button" class="btn-secondary" id="changePhotoButton">Change Photo</button>
                    <button type="button" class="btn-secondary" id="profileEditButton">Edit Profile</button>
                    <input type="file" id="profilePhotoInput" accept="image/*" hidden>
                </div>
            </div>
        </div>

        <div class="profile-form-card">
            <form id="profileForm">
                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Personal Information</h4>
                        <p>Full name, display name, and identity details.</p>
                    </div>
                    <div class="form-group">
                        <label for="profileFullName">Full Name</label>
                        <input type="text" id="profileFullName" name="profileFullName" placeholder="Enter your full name" readonly>
                    </div>
                    <div class="form-group">
                        <label for="profileDisplayNameField">Display Name</label>
                        <input type="text" id="profileDisplayNameField" name="profileDisplayName" placeholder="Enter your display name" readonly>
                    </div>
                    <div class="form-grid-two">
                        <div class="form-group">
                            <label for="profileDob">Date of Birth</label>
                            <input type="date" id="profileDob" name="profileDob" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profileGender">Gender</label>
                            <select id="profileGender" name="profileGender" disabled>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="nonbinary">Non-binary</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Contact Information</h4>
                        <p>Email, phone number, and address on file.</p>
                    </div>
                    <div class="form-group">
                        <label for="profileEmail">Email Address</label>
                        <input type="email" id="profileEmail" name="profileEmail" readonly>
                    </div>
                    <div class="form-group">
                        <label for="profilePhone">Phone Number</label>
                        <input type="tel" id="profilePhone" name="profilePhone" placeholder="Enter your phone number" readonly>
                    </div>
                    <div class="form-group">
                        <label for="profileAddress">Address</label>
                        <input type="text" id="profileAddress" name="profileAddress" placeholder="Enter your address" readonly>
                    </div>
                    <div class="form-grid-two student-only-field">
                        <div class="form-group">
                            <label for="profileGuardianContact">Guardian Contact Number</label>
                            <input type="text" id="profileGuardianContact" name="profileGuardianContact" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profileFbName">FB Name</label>
                            <input type="text" id="profileFbName" name="profileFbName" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profileFlagGroup">Flag Group</label>
                        <select id="profileFlagGroup" name="profileFlagGroup" disabled>
                            <option value="">Select flag group</option>
                            <option value="faithfulness">Faithfulness</option>
                            <option value="kindness">Kindness</option>
                            <option value="peace">Peace</option>
                            <option value="love">Love</option>
                            <option value="self_control">Self Control</option>
                            <option value="joy">Joy</option>
                            <option value="greatfulness">Greatfulness</option>
                            <option value="gentleness">Gentleness</option>
                        </select>
                    </div>
                    <div class="form-group student-only-field">
                        <label>Additional Curriculum (Irregular)</label>
                        <div class="profile-value" id="profileAdditionalCurriculumContent">No additional curriculum assigned.</div>
                    </div>
                </div>

                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Academic Information</h4>
                        <p>Student or employee profile details for the school system.</p>
                    </div>
                    <div class="form-group">
                        <label for="profileStudentId">ID Number</label>
                        <input type="text" id="profileStudentId" name="profileStudentId" readonly>
                    </div>
                    <div class="form-group">
                        <label for="profileRoleInput">Role</label>
                        <input type="text" id="profileRoleInput" name="profileRole" readonly>
                    </div>
                </div>

                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Preferences</h4>
                        <p>Notification and display preferences.</p>
                    </div>
                    <div class="form-group">
                        <label>Notifications</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" id="profileNotifications" name="profileNotifications" disabled> Email notifications</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profileTheme">Theme</label>
                        <select id="profileTheme" name="profileTheme" disabled>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </div>

                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Account & Security</h4>
                        <p>Status information and action controls.</p>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <button type="button" class="btn-secondary btn-block" id="changePasswordButton">Change Password</button>
                    </div>
                    <div class="form-group">
                        <label>Send Verification Code</label>
                        <button type="button" class="btn-secondary btn-block" id="sendVerificationButton">Send Verification Code</button>
                    </div>
                    <div class="password-section" id="passwordFieldsContainer" style="display:none;">
                        <div class="form-group">
                            <label for="profileCurrentPassword">Current Password</label>
                            <input type="password" id="profileCurrentPassword" name="profileCurrentPassword" placeholder="Enter current password" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profileNewPassword">New Password</label>
                            <input type="password" id="profileNewPassword" name="profileNewPassword" placeholder="Enter a new password" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profileConfirmPassword">Confirm Password</label>
                            <input type="password" id="profileConfirmPassword" name="profileConfirmPassword" placeholder="Confirm new password" readonly>
                        </div>
                        <div class="form-group">
                            <button type="button" class="btn-primary btn-block" id="savePasswordButton">Save Password</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Two-Factor Authentication</label>
                        <div class="profile-value" id="profileTwoFactor">Disabled</div>
                    </div>
                    <div class="form-group">
                        <label>Active Sessions</label>
                        <div class="profile-value">1 active session</div>
                    </div>
                </div>

                <div class="profile-section-block">
                    <div class="section-heading">
                        <h4>Profile History</h4>
                        <p>Important audit dates and recent account activity.</p>
                    </div>
                    <div class="form-group">
                        <label>Last Login</label>
                        <div class="profile-value" id="profileLastLogin">Never</div>
                    </div>
                    <div class="form-group">
                        <label>Created On</label>
                        <div class="profile-value" id="profileCreatedOn">—</div>
                    </div>
                    <div class="form-group">
                        <label>Last Updated</label>
                        <div class="profile-value" id="profileLastUpdated">—</div>
                    </div>
                </div>

                <div class="profile-section-block danger-zone">
                    <div class="section-heading">
                        <h4>Danger Zone</h4>
                        <p>Account deactivation and sensitive actions.</p>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn-secondary btn-danger" id="deleteAccountButton">Deactivate Account</button>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" id="profileSaveButton" style="display:none;">Save Changes</button>
                    <button type="button" class="btn-secondary" id="profileResetButton" style="display:none;">Reset</button>
                    <button type="button" class="btn-secondary" id="profileCancelButton" style="display:none;">Cancel</button>
                </div>
                <div class="profile-save-message" id="profileSaveMessage" aria-live="polite"></div>
            </form>
        </div>
    </div>
</div>