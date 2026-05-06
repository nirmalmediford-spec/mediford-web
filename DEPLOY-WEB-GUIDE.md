# 🚀 Mediford Inquiry — Web App Deployment Guide

You'll have your website live at **https://mediford-inquiry.web.app** — completely FREE.

---

## ⏱️ TIME NEEDED

**~25 minutes total** (one-time setup, never need to do again)

---

## 📋 OVERVIEW — 5 STEPS

| Step | What | Where | Time |
|------|------|-------|------|
| 1 | Create Web App in Firebase | Firebase Console | 3 min |
| 2 | Edit `firebase.js` (paste 1 ID) | GitHub | 2 min |
| 3 | Enable Firebase Hosting | Firebase Console | 2 min |
| 4 | Generate service account key | Firebase Console | 5 min |
| 5 | Create new GitHub repo + upload | GitHub | 10 min |

After step 5, your website auto-builds and deploys! 🎉

---

## STEP 1 — Create Web App in Firebase

📍 Go to: **https://console.firebase.google.com/project/mediford-inquiry/settings/general**

1. Scroll to the bottom → "Your apps" section
2. Click the **`</>` (Web)** icon to add a Web App
3. Enter app nickname: `Mediford Web`
4. ☑️ **Check the box** "Also set up Firebase Hosting for this app"
5. Click **"Register app"**
6. You'll see Firebase config code like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSyA5cOTC4DkSCy_npy7YMcGWAxAVYWoj8Lo",
     authDomain: "mediford-inquiry.firebaseapp.com",
     projectId: "mediford-inquiry",
     storageBucket: "mediford-inquiry.firebasestorage.app",
     messagingSenderId: "24072414839",
     appId: "1:24072414839:web:abcdef1234567890"   ← COPY THIS LINE
   };
   ```

7. **📋 Copy the appId value** (the part inside the quotes, like `1:24072414839:web:abcdef...`)
8. Click "Next" → "Next" → "Continue to console" (skip the CLI installation steps)

---

## STEP 2 — Edit firebase.js

After uploading code to GitHub (step 5), come back to this:

1. Go to your new GitHub repo
2. Open `src/firebase.js`
3. Click the pencil ✏️ icon to edit
4. Find this line:
   ```js
   appId: '__REPLACE_WITH_WEB_APP_ID__'
   ```
5. Replace `__REPLACE_WITH_WEB_APP_ID__` with the appId you copied in Step 1
6. Click "Commit changes"

---

## STEP 3 — Enable Firebase Hosting

📍 Go to: **https://console.firebase.google.com/project/mediford-inquiry/hosting**

1. Click **"Get Started"**
2. Skip all the CLI installation steps (just click "Next" repeatedly)
3. Click "Continue to console" at the end
4. ✅ Hosting is now enabled — your URL `https://mediford-inquiry.web.app` is reserved

---

## STEP 4 — Get Service Account Key

📍 Go to: **https://console.firebase.google.com/project/mediford-inquiry/settings/serviceaccounts/adminsdk**

1. Click the **"Service accounts"** tab at the top
2. Click **"Generate new private key"** button
3. Click **"Generate key"** in the popup
4. A JSON file will download (something like `mediford-inquiry-firebase-adminsdk-xxx.json`)
5. **Keep this file safe!** You'll need it in Step 5

---

## STEP 5 — Create GitHub Repo + Upload

### 5A. Create new repo

📍 Go to: **https://github.com/new**

1. Repository name: `mediford-web`
2. Owner: `nirmalmediford-spec`
3. Set to **Private**
4. ☑️ Check **"Add a README file"**
5. Click **"Create repository"**

### 5B. Upload code

1. On the new repo page, click **"Add file"** → **"Upload files"**
2. Open the `mediford-web` folder I gave you on your computer
3. **Select ALL contents** (Ctrl+A or Cmd+A) — files AND folders
4. **Drag them into the GitHub upload area**
5. Wait for upload to finish (~2 min)
6. Scroll down → write commit message: `Initial upload`
7. Click **"Commit changes"**

### 5C. Add Firebase secret to GitHub

1. In your repo, click **"Settings"** (top tab)
2. Left sidebar → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
4. Name: `FIREBASE_SERVICE_ACCOUNT`
5. Secret value: **Open the JSON file you downloaded in Step 4** in any text editor (Notepad), copy ALL the content, paste here
6. Click **"Add secret"**

### 5D. Edit firebase.js (now do Step 2)

Now go back and do **Step 2** (edit `src/firebase.js` with your appId).

When you commit that change, GitHub Actions will automatically:
- ✅ Build your website
- ✅ Deploy to Firebase Hosting
- ✅ Make it live at https://mediford-inquiry.web.app

This takes ~3-4 minutes.

---

## 🎉 VERIFY IT WORKS

1. Go to **Actions** tab in your GitHub repo
2. Wait for the green ✅ on "Deploy to Firebase Hosting"
3. Open **https://mediford-inquiry.web.app** in browser
4. Login with the same email/password as your phone app
5. You should see your Dashboard with leads & tenders! 🚀

---

## ❓ TROUBLESHOOTING

**"Login fails / something doesn't work"**
- Make sure you replaced `__REPLACE_WITH_WEB_APP_ID__` in `src/firebase.js` (Step 2)
- Make sure the appId starts with `1:24072414839:web:`

**"Build fails in GitHub Actions (red ❌)"**
- Click on the failed run → look at the error
- Most common: forgot to add `FIREBASE_SERVICE_ACCOUNT` secret (Step 5C)

**"My data doesn't appear"**
- Same Firebase project — your phone app data IS the website data
- If empty, login on the phone first to make sure data exists

---

## 🔄 HOW TO MAKE CHANGES LATER

Just edit any file on GitHub web UI → commit. Within 4 minutes, the website auto-updates.

I can also send you updated zip files anytime — just upload to overwrite.

---

## 💰 COST

**₹0/month** for your team size (4-10 people).

Firebase free tier covers:
- ✅ Hosting (10GB storage + 360MB/day bandwidth — way more than you need)
- ✅ Auth (unlimited)
- ✅ Firestore (already on Blaze plan with ₹500 budget alert)

You'll never pay for hosting unless you suddenly get 1 million visitors per day. 😄

---

## 📞 YOUR LIVE URL (after deployment)

🌐 **https://mediford-inquiry.web.app**

Bookmark it on your laptop and your team's laptops!
