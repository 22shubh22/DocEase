# DocEase - User Guide
## Doctor Clinic Management System

---

## Welcome to DocEase!

DocEase is a complete clinic management system designed to help you manage your patients, appointments, prescriptions, and billing - all in one place. This guide will walk you through everything you need to know to use the application effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Patients](#managing-patients)
4. [OPD Queue Management](#opd-queue-management)
5. [Recording Patient Visits](#recording-patient-visits)
6. [Creating Prescriptions](#creating-prescriptions)
7. [Billing & Invoices](#billing--invoices)
8. [Settings & Customization](#settings--customization)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### How to Access DocEase

1. **Open your web browser** (Chrome, Firefox, or Safari recommended)
2. **Go to the application URL** provided by your IT team
3. **Login Page** will appear

### First Time Login

1. **Enter your email address** (provided by your administrator)
2. **Enter your password** (provided by your administrator)
3. Click the **"Sign In"** button
4. You'll be taken to the Dashboard

**Note:** Currently in demo mode - you can use any email and password to login for testing purposes.

---

## Dashboard Overview

After logging in, you'll see the **Dashboard** - your home screen with:

- **Quick Statistics**: Total patients, today's appointments, revenue summary
- **Recent Activity**: Latest patient visits and updates
- **Quick Actions**: Buttons to quickly add patients, record visits, etc.

### Navigation Menu (Left Sidebar)

The menu on the left side lets you navigate to different sections:

- **📊 Dashboard** - Home screen with overview
- **👥 Patients** - Manage all patient records
- **🏥 OPD Queue** - Manage today's appointment queue
- **💰 Billing** - Create and manage invoices
- **⚙️ Settings** - Customize your preferences

---

## Managing Patients

### Adding a New Patient

1. Click **"Patients"** in the left menu
2. Click the **"+ Add New Patient"** button (top right)
3. Fill in the patient information:

#### Personal Information
- **Full Name** (Required) - Patient's complete name
- **Age** - Patient's age in years
- **Gender** - Select Male/Female/Other
- **Blood Group** - Select from dropdown (A+, B+, O+, etc.)

#### Contact Information
- **Phone Number** (Required) - Patient's mobile number
- **Emergency Contact** - Alternative contact number
- **Address** - Complete residential address

#### Medical Information
- **Known Allergies** - Enter allergies separated by commas (e.g., "Penicillin, Aspirin")
- **Medical History** - Previous conditions, surgeries, ongoing treatments

4. Click **"Add Patient"** to save
5. You'll see a success message with the Patient Code (e.g., PT-0001)

### Viewing Patient Details

1. Go to **"Patients"** from the menu
2. Find the patient in the list (you can use the search bar)
3. Click **"View"** next to the patient's name
4. You'll see three tabs:
   - **Overview** - Personal, contact, and medical information
   - **Visit History** - All previous consultations
   - **Prescriptions** - All prescriptions issued

### Editing Patient Information

1. Open the patient's details page
2. Click the **"✏️ Edit"** button (top right)
3. Update the required information
4. Click **"Update Patient"** to save changes

### Quick Actions from Patient Details

From any patient's detail page, you can quickly:
- **📝 New Visit** - Record a new consultation
- **💊 Add Prescription** - Create a new prescription
- **💰 Create Invoice** - Generate billing invoice

---

## OPD Queue Management

The OPD Queue helps you manage your daily appointments and patient flow.

### Adding Patient to Queue

1. Click **"OPD Queue"** from the left menu
2. Click **"+ Add to Queue"** button
3. Fill in the details:
   - **Select Patient** - Choose from existing patients
   - **Appointment Time** - Scheduled time slot
   - **Chief Complaint** - Why the patient is visiting (e.g., "Fever, headache")
4. Click **"Add to Queue"**

### Understanding Queue Status

Each patient in the queue has a status badge:

- **🟡 WAITING** - Patient is waiting for consultation
- **🔵 IN PROGRESS** - Currently being consulted
- **🟢 COMPLETED** - Consultation finished

### Managing the Queue

**For WAITING patients:**
- Click **"Start Consultation"** to begin
- Click **"View Patient"** to see patient details

**For IN PROGRESS patients:**
- Click **"Record Visit"** to document the consultation
- Click **"Mark Complete"** when done

**For COMPLETED patients:**
- Click **"View Patient"** to see details
- Click **"Reopen"** if you need to see them again

### Queue Statistics

At the top, you'll see:
- **Total Today** - All appointments for the day
- **Waiting** - Patients waiting for consultation
- **In Progress** - Currently being seen
- **Completed** - Finished consultations

---

## Recording Patient Visits

When you consult a patient, record the visit details:

### How to Record a Visit

1. **Start from:**
   - OPD Queue → Click **"Record Visit"** on IN PROGRESS patient, OR
   - Patient Details → Click **"📝 New Visit"**, OR
   - Direct menu → **"Visits"** → **"New Visit"**

2. **Select Patient** (if not pre-selected)

3. **Record Vital Signs:**
   - **Blood Pressure (BP)** - e.g., 120/80
   - **Temperature** - e.g., 98.6°F
   - **Pulse** - e.g., 72 bpm
   - **Weight** - e.g., 70 kg
   - **Height** - e.g., 170 cm
   - **SpO2** - e.g., 98%

4. **Consultation Details:**
   - **Chief Complaints/Symptoms** (Required) - Patient's main complaints
   - **Diagnosis** (Required) - Your medical diagnosis
   - **Clinical Observations** - Additional notes
   - **Recommended Tests** - Lab tests needed (comma separated)
   - **Follow-up Date** - Next appointment date

5. Click **"✓ Save Visit"**

**Note:** If the patient has allergies, you'll see a red alert box at the top as a reminder.

---

## Creating Prescriptions

### How to Create a Prescription

1. **Start from:**
   - Patient Details → Click **"💊 Add Prescription"**, OR
   - After recording a visit → Click prescription option, OR
   - Direct menu → **"Prescriptions"** → **"New"**

2. **Select Patient** (if not pre-selected)

3. **Fill Clinical Details:**
   - **Chief Complaint (C/C)** (Required) - Main complaint
   - **Medical History (M/H)** - Relevant medical history
   - **Clinical Diagnosis (C/Dia)** - Your diagnosis
   - **Treatment (T/T)** - Treatment plan

4. **Add Medicines:**
   - Click **"+ Add Medicine"** button
   - For each medicine, enter:
     - **Medicine Name** - e.g., "Tab Moxclav 625 MG (10)"
     - **Dosage** - e.g., "1 Tab B.D."
     - **Duration** - e.g., "For 5 Days"
   - Click **"Remove"** if you need to delete a medicine
   - Add as many medicines as needed

5. Click **"Preview & Print"**

### Printing the Prescription

1. After clicking Preview, you'll see how the prescription will look
2. **Review** all the details carefully
3. **Print Position Settings** are shown at the top
   - This tells you where on the page the prescription will print
   - Useful if you're using pre-printed letterhead
4. Click **"🖨️ Print Prescription"** button
5. Your browser's print dialog will open
6. Select your printer and click Print
7. After printing, click **"Close"** to create a new prescription

**Tip:** Configure print position in Settings to match your letterhead.

---

## Billing & Invoices

### Creating an Invoice

1. **Start from:**
   - Patient Details → Click **"💰 Create Invoice"**, OR
   - Menu → Click **"Billing"**

2. **Select Patient** from the dropdown

3. **Add Invoice Items:**

   **Option A: Quick Add Common Services**
   - Click any quick-add button (e.g., "Consultation Fee - ₹500")
   - The service will be added automatically

   **Option B: Add Custom Items**
   - Click **"+ Add Item"** button
   - Fill in:
     - **Description** - Service/item name
     - **Quantity** - Number of units
     - **Price (₹)** - Price per unit
   - Amount will calculate automatically
   - Click **"✕"** to remove an item

4. **Payment Details:**
   - **Tax Rate (%)** - Enter GST/tax percentage (optional)
   - **Discount (₹)** - Enter discount amount (optional)
   - **Payment Method** - Select: Cash, Card, UPI, Net Banking, or Insurance
   - **Notes** - Any special instructions

5. **Review Totals:**
   - **Subtotal** - Total before tax and discount
   - **Tax** - Calculated based on tax rate
   - **Discount** - Amount being discounted
   - **Total** - Final amount to be paid

6. Click **"✓ Create Invoice"**

### Invoice Details

After creating:
- Each invoice gets a unique number (e.g., INV-1001)
- Status is set to "UNPAID" initially
- You'll be redirected to the patient's page

---

## Settings & Customization

Access Settings from the **⚙️ Settings** menu option.

### Profile Settings

Update your personal information:
- **Full Name** - Your name as it appears on prescriptions
- **Email** - Your email address
- **Phone** - Your contact number
- **Specialty** - Your medical specialty (e.g., "General Physician")
- **License Number** - Your medical license/registration number

Click **"Save Changes"** after updating.

### Clinic Settings

Configure your clinic information:
- **Clinic Name** - Your clinic's name
- **Clinic Address** - Complete clinic address
- **Clinic Phone** - Clinic contact number
- **Clinic Email** - Clinic email address
- **Clinic Logo URL** - Link to your clinic logo (optional)

This information appears on printed prescriptions.

### Change Password

Update your login password:
1. Enter **Current Password**
2. Enter **New Password** (minimum 6 characters)
3. **Confirm New Password** (must match)
4. Click **"Change Password"**

### Preferences

#### Prescription Print Settings

**Important for printing prescriptions on letterhead!**

1. Go to **Preferences** tab in Settings
2. Scroll to **"Prescription Print Settings"**
3. Adjust the print position:
   - **Distance from Top** - How far down from the top edge
   - **Distance from Left** - How far from the left edge
   - Use sliders or enter exact pixel values
   - Values are shown in both pixels (px) and centimeters (cm)

4. **Preview on A4 Page:**
   - See a visual preview of where content will print
   - Yellow highlighted area shows the print zone

5. **Quick Presets:**
   - **Default (Letterhead)** - Top: 280px, Left: 40px
   - **Full Page** - Top: 0px, Left: 40px

6. Click **"Save Print Settings"**

**Why is this important?**
- If you use pre-printed letterhead with your clinic name/logo at the top, you need to position the prescription content below it
- The default setting (280px from top) leaves space for standard letterhead
- Adjust these values to match your specific letterhead design

#### Other Preferences

- **Default Consultation Fee** - Set your standard consultation charge
- **Appointment Duration** - Default time slot length (10-60 minutes)

---

## Tips & Best Practices

### Daily Workflow

**Recommended Daily Process:**

1. **Morning:**
   - Review today's appointments in OPD Queue
   - Check if all scheduled patients are added

2. **During Consultations:**
   - Mark patient as "In Progress" in queue
   - Record visit with vitals and diagnosis
   - Create prescription if needed
   - Mark as "Completed" in queue
   - Generate invoice for services

3. **End of Day:**
   - Review completed consultations
   - Check pending invoices
   - Plan next day's schedule

### Search & Find Quickly

**Finding Patients:**
- Use the **search bar** on Patients page
- Search by: Name, Patient Code, or Phone Number
- Results update as you type

**Queue Filtering:**
- Use the **filter tabs** (All, Waiting, In Progress, Completed)
- Click on status badges to filter quickly

### Data Entry Tips

✅ **Do:**
- Fill all required fields marked with *
- Use standard formats (e.g., "+91 9876543210" for phone)
- Enter allergies clearly and separated by commas
- Be specific in symptoms and diagnosis
- Review prescription before printing

❌ **Don't:**
- Leave emergency contact blank (very important!)
- Skip vital signs during visits
- Forget to mark queue status updates
- Print prescription without reviewing

### Important Notes

**📝 Current Demo Mode:**
- All data is stored temporarily in your browser
- Data will reset if you refresh the page
- This is for testing and demonstration only
- In production, all data will be saved permanently to the database

**🔒 Data Privacy:**
- Always log out when finished
- Don't share your login credentials
- Keep patient information confidential

**💾 Backup:**
- Once the full system is deployed, data will be automatically backed up
- You can export data from Settings → Danger Zone

---

## Frequently Asked Questions (FAQ)

**Q: What if I make a mistake while entering patient data?**
A: You can always edit patient information by going to their details page and clicking the "Edit" button.

**Q: Can I delete a patient from the queue?**
A: Currently, you can mark them as completed. In the full version, deletion options will be available with proper permissions.

**Q: How do I find old patient records?**
A: Go to Patients page, use the search bar to find the patient by name or code, then click "View" to see all their history.

**Q: The prescription is not printing in the right position on my letterhead. What should I do?**
A: Go to Settings → Preferences → Prescription Print Settings and adjust the "Distance from Top" and "Distance from Left" values until it matches your letterhead.

**Q: Can I customize the invoice format?**
A: The current format is standard. Custom formats will be available in future updates.

**Q: What happens if I close the browser accidentally?**
A: In demo mode, you'll lose unsaved data. In the production version, all data is automatically saved to the server.

**Q: Can multiple staff members use this system?**
A: Yes! Each person will have their own login credentials with appropriate access levels (Doctor, Receptionist, etc.).

---

## Getting Help

### If You Need Assistance

**Technical Issues:**
- Contact your IT support team
- Provide details: What you were doing, what error appeared, screenshot if possible

**Feature Requests:**
- Let us know what additional features would help your practice
- We're continuously improving the system

**Training:**
- Additional training sessions can be arranged
- Video tutorials will be available soon

---

## System Requirements

**Recommended Setup:**
- **Internet Connection:** Stable broadband connection
- **Browser:** Google Chrome (latest version) or Firefox
- **Screen:** Minimum 1366x768 resolution (larger is better)
- **Printer:** Any standard printer for prescriptions and invoices

**For Mobile/Tablet:**
- The system is responsive and works on tablets
- For best experience, use a laptop or desktop computer

---

## Quick Reference Card

### Common Actions Shortcuts

| What You Want to Do | How to Do It |
|---------------------|-------------|
| Add new patient | Patients → + Add New Patient |
| Start consultation | OPD Queue → Start Consultation |
| Write prescription | Patient Details → 💊 Add Prescription |
| Create invoice | Patient Details → 💰 Create Invoice |
| Search patient | Go to Patients → Use search bar |
| Print prescription | Create prescription → Preview & Print |
| Change password | Settings → Change Password tab |
| Adjust print position | Settings → Preferences → Print Settings |

---

## Summary

DocEase simplifies your clinic management by bringing everything together:

✅ **Patient Records** - All patient information in one place
✅ **OPD Management** - Organized queue for smooth patient flow
✅ **Visit Documentation** - Complete consultation records with vitals
✅ **Digital Prescriptions** - Professional prescriptions ready to print
✅ **Billing Made Easy** - Quick invoice generation with automatic calculations
✅ **Customizable** - Adjust settings to match your workflow

**Remember:** The more consistently you use the system, the more valuable it becomes. All your patient history, prescriptions, and billing will be organized and accessible whenever you need them.

---

## Welcome Aboard!

Thank you for choosing DocEase for your clinic management needs. We're committed to making your practice more efficient and your patient care better.

If you have any questions or feedback, please don't hesitate to reach out to the support team.

**Happy practicing! 🏥**

---

*Document Version: 1.0*
*Last Updated: November 2024*
*For: DocEase Clinic Management System*
