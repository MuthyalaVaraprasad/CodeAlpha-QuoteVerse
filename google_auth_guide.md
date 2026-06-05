# Step-by-Step Developer Guide: Implementing Real Google Authentication

This guide details how to configure real Google Sign-In for **QuoteVerse AI** using the **Firebase Console** and **Google Cloud Console**.

---

## Step 1: Enable Google Authentication in Firebase

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project (e.g., **QuoteVerse AI**).
3. In the left sidebar, expand the **Build** section and click **Authentication**.
4. If you haven't initialized it yet, click **Get Started**.
5. Navigate to the **Sign-in method** tab.
6. Under **Additional providers**, click **Google**.
7. Toggle the **Enable** switch at the top-right.
8. Set the **Project public-facing name** (e.g., `QuoteVerse AI`).
9. Choose the **Project support email** from the dropdown menu.
10. Click **Save**.

> [!NOTE]
> Saving the Google provider automatically generates the client credentials in your Google Cloud account under the same project ID.

---

## Step 2: Configure the OAuth Consent Screen in Google Cloud Console

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the project selection dropdown at the top, select the **exact same project** you created in Firebase.
3. Click the navigation menu (hamburger icon) on the top left, then go to **APIs & Services** > **OAuth consent screen**.
4. Select the user type:
   - Choose **External** (this allows any Google Account to sign in).
   - Click **Create**.
5. Fill in the **App Information**:
   - **App name**: `QuoteVerse AI`
   - **User support email**: Select your email.
   - **App logo**: Optional (can upload if desired).
6. Fill in **Developer contact information**:
   - **Email addresses**: Your email.
7. Click **Save and Continue**.
8. On the **Scopes** page:
   - Click **Add or Remove Scopes**.
   - Check the boxes for the standard public profile scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Scroll down and click **Update**.
   - Click **Save and Continue**.
9. On the **Test Users** page (since your OAuth screen is in "Testing" status by default):
   - Click **Add Users**.
   - Enter your personal Google email address(es) that you intend to use for testing.
   - Click **Add** / **Save and Continue**.
10. Review the **Summary** page, then click **Back to Dashboard**.

---

## Step 3: Configure Authorized Redirect Domains & Origins

1. In the Google Cloud Console sidebar under **APIs & Services**, click on **Credentials**.
2. Under **OAuth 2.0 Client IDs**, locate the client ID automatically generated for your web application (usually named `Web client (auto created by Google Service)`).
3. Click the **Edit (pencil)** icon to modify its details.
4. Scroll to **Authorized JavaScript origins**:
   - Click **Add URI**.
   - Add your local development address: `http://localhost:5173`.
   - Add your Firebase hosting URL: `https://<your-firebase-project-id>.web.app` (if deployed).
5. Scroll to **Authorized redirect URIs**:
   - Verify that your Firebase auth redirect handler URI is present:
     `https://<your-firebase-project-id>.firebaseapp.com/__/auth/handler`
   - *If it is missing, copy this handler URL from your Firebase Console (Google sign-in settings page) and paste it here.*
6. Click **Save**.

---

## Step 4: Configure Environment Variables in QuoteVerse AI

Your local project requires the credentials to connect directly to your live Firebase project.

1. In the Firebase Console, go to **Project Settings** (gear icon next to Project Overview).
2. Under the **General** tab, scroll down to the **Your apps** section.
3. If you haven't created a web app, click the **Web icon (</>)** to add one. Give it a name like `QuoteVerse AI Web` and click **Register app**.
4. Copy the `firebaseConfig` JavaScript object details shown on the screen:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
5. In your local code workspace, create a file named `.env` in the root folder (duplicate of [.env.example](file:///c:/Users/Varaprasad/OneDrive/Desktop/Quotes/.env.example)):
   ```env
   VITE_FIREBASE_API_KEY=YOUR_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_APP_ID
   VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   VITE_USE_REAL_FIREBASE=true
   VITE_USE_REAL_GEMINI=true
   ```
6. Start your development server:
   ```bash
   npm run dev
   ```

---

## Step 5: Test the Sign-In Flow

1. Access QuoteVerse AI at `http://localhost:5173`.
2. Navigate to the **Profile** dashboard (or click log out to visit the Sign In screen).
3. Click the **Sign in with Google** button.
4. A Google Sign-In popup will appear prompting you to authorize the app. Select your testing email address.
5. Upon successful authorization, Firebase creates a user record in the **Authentication** panel, populates the Firestore database user profile table, and logs you into QuoteVerse AI!
