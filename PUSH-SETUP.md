# Automatic Push Notification Setup (ekbar korlei hobe)

## 1) Firebase
1. https://console.firebase.google.com → Add project (free).
2. Project e **Android app** add koro, package name: `com.changemaker.academy`.
3. `google-services.json` download koro.
4. Project settings → **Service accounts** → *Generate new private key* → ekta JSON file nibe (eta FCM_SERVICE_ACCOUNT).

## 2) GitHub secret
Repo → Settings → Secrets and variables → Actions → New secret
- Name: `GOOGLE_SERVICES_JSON`, Value: `google-services.json` er pura content paste.

## 3) Supabase
1. SQL Editor → `supabase/push-setup.sql` er `YOUR_PROJECT_REF` ar `YOUR_LONG_RANDOM_SECRET` bodle Run koro.
2. Edge Function deploy (CLI):
   ```
   supabase functions deploy send-push --no-verify-jwt
   supabase secrets set PUSH_WEBHOOK_SECRET=<ekoi random secret> FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
   ```
   (CLI na thakle Dashboard → Edge Functions → New function `send-push` → `index.ts` paste → Secrets e duto add.)

## 4) Notun APK
GitHub → Actions → *Build Android APK* → Run workflow. Log e `Firebase push ENABLED` dekhte hobe.
User ra notun APK install korle (app er update popup dibe) token save hobe.

## Kivabe kaj kore
- Admin Panel e notun Free Class / Teacher / PDF / Admission class-PDF / Exam / Story add → **automatic** notification.
- Admin Panel → Push Notifications → Send → custom notification.
- Ekoi dhoroner content 2 minute e ekadhik add korle shudhu prothom ta notification jay (spam atkate).
- Banner add korle notification jay na.
