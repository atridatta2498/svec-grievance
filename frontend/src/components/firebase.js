// Replace the config below with your Firebase project's config
// See README.md for setup steps.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store OTP in Firestore with expiration (5 minutes)
export async function sendOTPToEmail(email) {
  const otp = generateOTP()
  const otpDoc = {
    otp,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    verified: false
  }
  
  // Store OTP in Firestore
  await setDoc(doc(db, 'otps', email), otpDoc)
  
  // In a production app, you would send the OTP via email using:
  // - Firebase Extensions (Trigger Email)
  // - Cloud Functions with SendGrid/Mailgun/Nodemailer
  // - Third-party email service
  
  // For development/testing, we'll log it (REMOVE IN PRODUCTION)
  console.log('OTP for', email, ':', otp)
  
  // You can also call a Cloud Function here to send the email
  // await fetch('YOUR_CLOUD_FUNCTION_URL', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, otp })
  // })
  
  return { success: true, message: 'OTP sent to your email' }
}

// Verify OTP
export async function verifyOTP(email, otp) {
  const otpDocRef = doc(db, 'otps', email)
  const otpDoc = await getDoc(otpDocRef)
  
  if (!otpDoc.exists()) {
    throw new Error('No OTP found for this email')
  }
  
  const data = otpDoc.data()
  const now = new Date()
  const expiresAt = new Date(data.expiresAt)
  
  if (now > expiresAt) {
    throw new Error('OTP has expired')
  }
  
  if (data.otp !== otp) {
    throw new Error('Invalid OTP')
  }
  
  // Mark as verified
  await setDoc(otpDocRef, { ...data, verified: true })
  
  return { success: true, message: 'OTP verified successfully' }
}

// wrapper to send email sign-in link (passwordless)
export async function sendSignInLinkToEmailWrapper(email) {
  const actionCodeSettings = {
    // After sign-in, the user will be redirected back to this URL.
    url: window.location.origin + '/?email=' + encodeURIComponent(email),
    handleCodeInApp: true
  }
  return sendSignInLinkToEmail(auth, email, actionCodeSettings)
}

export async function addGrievance(data) {
  return addDoc(collection(db, 'grievances'), data)
}

export default app
