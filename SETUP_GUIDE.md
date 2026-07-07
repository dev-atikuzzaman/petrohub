# 🎓 BIM Knowledge Hub v2.0 — Supabase সংস্করণ

আলহামদুলিল্লাহ! আপনার প্রজেক্ট সম্পূর্ণভাবে rebuild করা হয়েছে — Firebase/Google Sheets বাদ দিয়ে **Supabase** দিয়ে, সাথে **real multi-user authentication** যোগ করা হয়েছে।

---

## 🆕 কী কী নতুন/বদলেছে

| আগে (v1) | এখন (v2) |
|---|---|
| Mock data (ভুয়া demo) | আসল Supabase database |
| Google Sheets থেকে read-only data | প্রতিটা সদস্য নিজে signup করে নিজের প্রোফাইল লেখে |
| কোনো login সিস্টেম ছিল না | Email/Password দিয়ে real login |
| Firebase (অব্যবহৃত ছিল) | Supabase (Auth + Database + Storage সব একসাথে) |
| Static mock posts | Real-time posts — যে কেউ পোস্ট দিলে সবার স্ক্রিনে সাথে সাথে দেখা যাবে |
| ছবি আপলোড ছিল না | Supabase Storage দিয়ে real avatar ও post-image আপলোড |

UI ডিজাইন (glass/gradient স্টাইল, নীল রং, ৩-ট্যাব নেভিগেশন) আগের মতোই রাখা হয়েছে — শুধু আরো পরিষ্কার ও ফাংশনাল করা হয়েছে।

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
bim-hub/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── favicon.ico, logo192.png, logo512.png
│
├── src/
│   ├── App.js                      ← মূল অ্যাপ shell, navigation
│   ├── index.js, index.css
│   ├── reportWebVitals.js
│   │
│   ├── lib/
│   │   ├── supabaseClient.js       ← Supabase connection
│   │   ├── AuthContext.js          ← Login/Signup/Session ব্যবস্থাপনা
│   │   └── dataService.js          ← posts/comments/reactions/profiles এর সব ফাংশন
│   │
│   ├── components/
│   │   ├── AuthScreen.js           ← Login + Signup স্ক্রিন
│   │   ├── Avatar.js, Badge.js
│   │   ├── ProfileModal.js         ← প্রোফাইল দেখা/এডিট করা
│   │   ├── PostCard.js             ← পোস্ট + কমেন্ট + রিয়্যাকশন
│   │   ├── CreatePostModal.js
│   │   ├── MultiSelect.js          ← ফিল্টার ড্রপডাউন
│   │   └── Icons.js
│   │
│   └── pages/
│       ├── FeedTab.js
│       ├── MembersTab.js
│       ├── StatsTab.js
│       └── AdminPanel.js           ← ৮০ জনের email pre-load করার প্যানেল
│
├── supabase/
│   └── schema.sql                  ⭐ এটা Supabase এ একবার চালাতে হবে
│
├── .env.example
└── package.json
```

---

## ⚙️ ধাপে ধাপে সেটআপ

### ধাপ ১: Supabase প্রজেক্ট তৈরি করুন

1. [supabase.com](https://supabase.com) → Sign up / Login
2. **New Project** → নাম দিন `bim-knowledge-hub`
3. Database password সেট করুন (মনে রাখবেন)
4. Region: **Southeast Asia (Singapore)** বেছে নিন (Bangladesh থেকে সবচেয়ে কাছে)
5. প্রজেক্ট তৈরি হতে ১-২ মিনিট সময় লাগবে

### ধাপ ২: Database Schema বসান

1. Supabase Dashboard → বাম পাশের মেনু থেকে **SQL Editor**
2. **New Query** ক্লিক করুন
3. `supabase/schema.sql` ফাইলের **পুরো কন্টেন্ট** copy করে paste করুন
4. **Run** চাপুন (নিচে ডান কোণায়)
5. সফল হলে "Success. No rows returned" দেখাবে
6. এরপর `supabase/migration_2_notes_updates_documents.sql` ফাইলটাও একইভাবে
   (New Query → পুরো কন্টেন্ট পেস্ট → Run) চালিয়ে নিন — এটা ছাড়া
   **আপডেট, নোট ও ডকুমেন্ট ট্যাব থেকে কিছু সেভ/আপলোড হবে না**, কারণ
   এই ফিচারগুলোর টেবিল ও স্টোরেজ বাকেট এই ফাইলেই তৈরি হয়।

এতে স্বয়ংক্রিয়ভাবে তৈরি হয়ে যাবে:
- ✅ `profiles`, `posts`, `comments`, `reactions`, `pending_invites` টেবিল
- ✅ Row Level Security (RLS) — যাতে কেউ অন্যের একাউন্ট হ্যাক করতে না পারে
- ✅ Real-time subscriptions
- ✅ Storage buckets (avatars, post-images)
- ✅ Signup হলেই স্বয়ংক্রিয় প্রোফাইল তৈরির trigger

### ধাপ ৩: API Keys সংগ্রহ করুন

1. Supabase Dashboard → ⚙️ **Project Settings** → **API**
2. Copy করুন:
   - **Project URL** (যেমন: `https://xxxxx.supabase.co`)
   - **anon / public key** (লম্বা একটা টোকেন)

### ধাপ ৪: `.env` ফাইল তৈরি করুন

প্রজেক্টের root এ (যেখানে `package.json` আছে) `.env` ফাইল বানান:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=আপনার_anon_key_এখানে

REACT_APP_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/আপনার_group_link
```

⚠️ **`.env` ফাইল কখনো GitHub এ push করবেন না** — `.gitignore` এ এটা আগে থেকেই বাদ দেওয়া আছে।

### ধাপ ৫: Install ও Run করুন

```bash
npm install
npm start
```

`http://localhost:3000` এ ব্রাউজার খুলবে — **Signup** স্ক্রিন দেখবেন।

### ধাপ ৬: নিজের Admin Account বানান

1. App এ গিয়ে নিজের নাম, ইমেইল, পাসওয়ার্ড দিয়ে **Signup** করুন
2. লগইন করুন
3. Supabase Dashboard → **SQL Editor** এ গিয়ে এই কমান্ড চালান (নিজের ইমেইল বসিয়ে):

```sql
update public.profiles set is_admin = true where email = 'আপনার_ইমেইল@gmail.com';
```

4. App refresh করুন — এখন হেডারে একটা 🛡️ Shield আইকন দেখবেন (Admin Panel)

---

## 👥 ৮০ জন সদস্যকে কীভাবে যোগ করবেন

দুইভাবে কাজ করবে:

### A) Admin Pre-load (আপনি করবেন)
1. Admin Panel (🛡️ আইকন) খুলুন
2. প্রতিটা সদস্যের নাম + ইমেইল (এবং চাইলে জেলা/বিশ্ববিদ্যালয় ইত্যাদি) যোগ করুন
3. তারা যখন সেই একই ইমেইল দিয়ে signup করবে, তাদের প্রোফাইল **স্বয়ংক্রিয়ভাবে** পূরণ হয়ে যাবে

### B) Open Signup (সবাই নিজে করবে)
- যে কেউ যেকোনো ইমেইল দিয়ে সরাসরি signup করতে পারবে
- নিজের প্রোফাইল (জেলা, বিশ্ববিদ্যালয়, প্রতিষ্ঠান ইত্যাদি) নিজে পূরণ করবে — Profile Modal এ **Edit** বাটনে চেপে

দুটো একসাথেই চলবে — pre-load না থাকলেও signup করতে কোনো বাধা নেই।

---

## 📱 Features Checklist

- ✅ Real email/password authentication (Supabase Auth)
- ✅ প্রতিটা সদস্যের নিজস্ব account, নিজের প্রোফাইল এডিট করার ক্ষমতা
- ✅ Real-time post feed — যেকোনো ডিভাইস থেকে পোস্ট করলে সবাই সাথে সাথে দেখবে
- ✅ Comments + nested replies
- ✅ Emoji reactions (👍 ❤️ 😂 😮 😢 🔥)
- ✅ Avatar ও post image আপলোড (Supabase Storage)
- ✅ Member directory — search + multi-filter (জেলা/বিশ্ববিদ্যালয়/প্রতিষ্ঠান)
- ✅ CSV export
- ✅ Statistics ড্যাশবোর্ড (bar chart)
- ✅ Admin panel — সদস্য pre-load
- ✅ PWA — installable, offline shell caching
- ✅ Row Level Security — নিজের ডেটা নিজে ছাড়া কেউ বদলাতে পারবে না

---

## 🚀 Vercel এ Deploy করা

```bash
npm install -g vercel
vercel login
vercel
```

Vercel Dashboard → Settings → Environment Variables এ যোগ করুন:
```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_WHATSAPP_GROUP_LINK
```

তারপর redeploy করুন।

---

## 🐛 সমস্যা সমাধান

| সমস্যা | সমাধান |
|---|---|
| "Profile load error" | schema.sql ঠিকভাবে চালানো হয়েছে কিনা চেক করুন |
| Signup করার পর প্রোফাইল ফাঁকা | এটাই স্বাভাবিক — Profile Modal এ Edit চেপে নিজে পূরণ করতে হবে |
| ছবি আপলোড হচ্ছে না | Supabase Dashboard → Storage এ `avatars`, `post-images` bucket আছে কিনা দেখুন |
| Real-time কাজ করছে না | schema.sql এর `alter publication supabase_realtime add table...` লাইনগুলো ঠিকভাবে চলেছে কিনা চেক করুন |
| Admin Panel দেখাচ্ছে না | `is_admin = true` করার SQL কমান্ড চালিয়েছেন কিনা, এবং app refresh করেছেন কিনা দেখুন |

---

## 🔐 নিরাপত্তা নোট

- Row Level Security (RLS) চালু আছে — প্রতিটা ইউজার শুধু নিজের পোস্ট/কমেন্ট/প্রোফাইল এডিট-ডিলিট করতে পারবে
- সবাই সবার প্রোফাইল ও পোস্ট **দেখতে** পারবে (community platform বলে)
- `anon key` পাবলিক হলেও সমস্যা নেই — RLS policy-ই আসল নিরাপত্তা দেয়
- `.env` ফাইল git এ push হবে না (`.gitignore` এ যোগ করা আছে)

---

**শুভকামনা আকিব ভাই! আলহামদুলিল্লাহ, আপনার প্রজেক্ট এখন একটা সত্যিকারের multi-user platform। 🚀**
