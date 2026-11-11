(function () {
    "use strict";

    const auth = window.CampusAuth;
    const nameNode = document.getElementById("profile-name");
    if (!nameNode || !auth) return;

    const byId = id => document.getElementById(id);
    const editButton = byId("edit-profile-button");
    const editPanel = byId("profile-edit-panel");
    const editForm = byId("profile-edit-form");
    const saveButton = byId("save-profile-button");
    const message = byId("profile-message");

    let currentUser = null;
    let currentProfile = null;

    function showMessage(text, type = "info") {
        message.textContent = text;
        message.className = `profile-message is-visible is-${type}`;
    }

    function hideMessage() {
        message.textContent = "";
        message.className = "profile-message";
    }

    function setText(id, value, fallback = "Not provided") {
        const node = byId(id);
        if (node) node.textContent = String(value || fallback);
    }

    function renderProfile(profile, user) {
        const fullName = profile.full_name || "BMU Student";
        const department = profile.department || "Department not provided";
        const academicYear = profile.academic_year || "Not provided";

        setText("profile-name", fullName, "BMU Student");
        setText("profile-department", department, "Department not provided");
        setText("profile-email", user.email || "—", "—");
        setText("profile-department-detail", department);
        setText("profile-year", academicYear);
        setText("profile-bio", profile.bio, "No introduction added yet.");

        byId("edit-full-name").value = profile.full_name || "";
        byId("edit-department").value = profile.department || "";
        byId("edit-academic-year").value = profile.academic_year || "";
        byId("edit-bio").value = profile.bio || "";
    }

    function openEditor() {
        hideMessage();
        if (currentProfile) renderProfile(currentProfile, currentUser);
        editPanel.hidden = false;
        editButton.setAttribute("aria-expanded", "true");
        editPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        byId("edit-full-name").focus({ preventScroll: true });
    }

    function closeEditor() {
        editPanel.hidden = true;
        editButton.setAttribute("aria-expanded", "false");
        if (currentProfile) renderProfile(currentProfile, currentUser);
        hideMessage();
    }

    async function loadProfile() {
        try {
            currentUser = await auth.getUser();
            if (!currentUser) return;

            const { data, error } = await auth.client
                .from("profiles")
                .select("id, full_name, department, academic_year, bio, avatar_url, created_at, updated_at")
                .eq("id", currentUser.id)
                .maybeSingle();

            if (error) {
                console.error("Could not load student profile:", error);
                showMessage("We couldn't load your profile from the database. Check the profiles table and run supabase/profile-edit-migration.sql in the Supabase SQL Editor.", "error");
                return;
            }

            if (!data) {
                showMessage("Your profile record was not found. Please sign out and sign in again. If the problem continues, check the profile-creation trigger in Supabase.", "error");
                return;
            }

            currentProfile = data;
            renderProfile(currentProfile, currentUser);
            editButton.disabled = false;
            editButton.setAttribute("aria-expanded", "false");
        } catch (error) {
            console.error("Profile loading failed:", error);
            showMessage(error.message || "Something went wrong while loading your profile.", "error");
        }
    }

    editButton.addEventListener("click", openEditor);
    byId("cancel-profile-edit").addEventListener("click", closeEditor);

    editForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!currentUser || !currentProfile || !editForm.reportValidity()) return;

        const updates = {
            full_name: byId("edit-full-name").value.trim(),
            department: byId("edit-department").value.trim(),
            academic_year: byId("edit-academic-year").value,
            bio: byId("edit-bio").value.trim() || null,
            updated_at: new Date().toISOString()
        };

        if (!updates.full_name || !updates.department || !updates.academic_year) {
            showMessage("Please complete your name, department and academic year.", "error");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving…";
        hideMessage();

        try {
            // RLS on public.profiles ensures this update can affect only the signed-in user's row.
            const { data, error } = await auth.client
                .from("profiles")
                .update(updates)
                .eq("id", currentUser.id)
                .select("id, full_name, department, academic_year, bio, avatar_url, created_at, updated_at")
                .single();

            if (error) throw error;

            currentProfile = data;
            renderProfile(currentProfile, currentUser);
            editPanel.hidden = true;
            editButton.setAttribute("aria-expanded", "false");
            showMessage("Your profile has been updated successfully.", "success");
        } catch (error) {
            console.error("Profile update failed:", error);
            const detail = error.message || "Unknown database error.";
            if (/column .*bio.* does not exist|could not find the .*bio.* column/i.test(detail)) {
                showMessage("The profile database needs one small update. Run supabase/profile-edit-migration.sql in your Supabase SQL Editor, then try saving again.", "error");
            } else {
                showMessage(`We couldn't save your changes: ${detail}`, "error");
            }
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save changes";
        }
    });

    loadProfile();
})();
