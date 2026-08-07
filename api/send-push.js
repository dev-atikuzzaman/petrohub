// api/send-push.js
// ============================================================
// পুশ নোটিফিকেশন পাঠানো — Supabase Database Webhook থেকে কল হয়
// ============================================================
// যেসব টেবিলে নতুন row insert হলে নোটিফিকেশন যাবে:
//   comments          → পোস্টের লেখক ও (রিপ্লাই হলে) কমেন্টের লেখককে
//   reactions         → পোস্টের লেখককে
//   important_updates → সবাইকে (যাদের পুশ চালু আছে)
//
// এটা web-push (npm প্যাকেজ) দিয়ে VAPID key ব্যবহার করে সরাসরি ব্রাউজারে
// পুশ পাঠায় — সম্পূর্ণ ফ্রি, কোনো তৃতীয়-পক্ষের paid সার্ভিস লাগে না।
// ============================================================
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:admin@petro-knowledge-hub.app',
  process.env.REACT_APP_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function getServiceClient() {
  return createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const secret = req.headers['x-webhook-secret'];
  if (!process.env.NOTIFY_WEBHOOK_SECRET || secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    res.status(401).send('Unauthorized');
    return;
  }

  const { type, table, record } = req.body || {};
  if (type !== 'INSERT' || !record) {
    res.status(200).send('ignored');
    return;
  }

  const supabaseAdmin = getServiceClient();

  try {
    if (table === 'posts') {
      await handlePostNotification(supabaseAdmin, record);
    } else if (table === 'comments') {
      await handleCommentNotification(supabaseAdmin, record);
    } else if (table === 'reactions') {
      await handleReactionNotification(supabaseAdmin, record);
    } else if (table === 'important_updates') {
      await handleImportantUpdateNotification(supabaseAdmin, record);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ send-push error:', err.message);
    // 200 রাখা হচ্ছে যাতে Supabase বারবার retry-storm না করে
    res.status(200).json({ ok: false, error: err.message });
  }
}

async function getSubscriptionsFor(supabaseAdmin, userId) {
  const { data } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId);
  return data || [];
}

async function sendToSubscription(supabaseAdmin, sub, payload) {
  const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
  } catch (err) {
    // 404/410 মানে এই সাবস্ক্রিপশন আর বৈধ না (ব্রাউজার/অনুমতি বাতিল) — মুছে ফেলা
    if (err.statusCode === 404 || err.statusCode === 410) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
    } else {
      console.error('⚠️ push send failed:', err.message);
    }
  }
}

async function sendToUser(supabaseAdmin, userId, payload) {
  const subs = await getSubscriptionsFor(supabaseAdmin, userId);
  await Promise.allSettled(subs.map((sub) => sendToSubscription(supabaseAdmin, sub, payload)));
}

async function notifyMentions(supabaseAdmin, mentionUserIds, authorId, authorName, payload, alreadyNotified = new Set()) {
  const uniqueIds = [...new Set(mentionUserIds || [])].filter((id) => id !== authorId && !alreadyNotified.has(id));
  await Promise.allSettled(uniqueIds.map((id) => sendToUser(supabaseAdmin, id, payload)));
}

async function handlePostNotification(supabaseAdmin, post) {
  if (!post.mentions || post.mentions.length === 0) return;

  const { data: author } = await supabaseAdmin.from('profiles').select('name').eq('id', post.user_id).single();
  const authorName = author?.name || 'একজন সদস্য';

  await notifyMentions(supabaseAdmin, post.mentions, post.user_id, authorName, {
    title: `${authorName} আপনাকে একটা পোস্টে মেনশন করেছেন`,
    body: (post.text || '').slice(0, 100),
    url: '/',
  });
}

async function handleCommentNotification(supabaseAdmin, comment) {
  const { data: author } = await supabaseAdmin.from('profiles').select('name').eq('id', comment.user_id).single();
  const commenterName = author?.name || 'একজন সদস্য';
  const notified = new Set();

  if (comment.parent_id) {
    const { data: parent } = await supabaseAdmin.from('comments').select('user_id').eq('id', comment.parent_id).single();
    if (parent && parent.user_id !== comment.user_id) {
      notified.add(parent.user_id);
      await sendToUser(supabaseAdmin, parent.user_id, {
        title: `${commenterName} আপনার মন্তব্যে রিপ্লাই দিয়েছেন`,
        body: comment.text.slice(0, 100),
        url: '/',
      });
    }
  }

  const { data: post } = await supabaseAdmin.from('posts').select('user_id').eq('id', comment.post_id).single();
  if (post && post.user_id !== comment.user_id && !notified.has(post.user_id)) {
    notified.add(post.user_id);
    await sendToUser(supabaseAdmin, post.user_id, {
      title: `${commenterName} আপনার পোস্টে মন্তব্য করেছেন`,
      body: comment.text.slice(0, 100),
      url: '/',
    });
  }

  // যাদের এই মন্তব্যে @মেনশন করা হয়েছে (উপরে আগেই নোটিফাই হওয়া কাউকে বাদ দিয়ে)
  await notifyMentions(supabaseAdmin, comment.mentions, comment.user_id, commenterName, {
    title: `${commenterName} আপনাকে একটা মন্তব্যে মেনশন করেছেন`,
    body: comment.text.slice(0, 100),
    url: '/',
  }, notified);
}

async function handleReactionNotification(supabaseAdmin, reaction) {
  const { data: post } = await supabaseAdmin.from('posts').select('user_id').eq('id', reaction.post_id).single();
  if (!post || post.user_id === reaction.user_id) return;

  const { data: reactor } = await supabaseAdmin.from('profiles').select('name').eq('id', reaction.user_id).single();
  await sendToUser(supabaseAdmin, post.user_id, {
    title: `${reactor?.name || 'একজন সদস্য'} আপনার পোস্টে ${reaction.emoji} রিয়্যাক্ট করেছেন`,
    body: 'দেখতে অ্যাপ খুলুন',
    url: '/',
  });
}

async function handleImportantUpdateNotification(supabaseAdmin, update) {
  const { data: author } = await supabaseAdmin.from('profiles').select('name').eq('id', update.user_id).single();
  const { data: allSubs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .neq('user_id', update.user_id);

  const payload = {
    title: `📢 নতুন গুরুত্বপূর্ণ আপডেট: ${update.title}`,
    body: (update.body || `${author?.name || ''} একটা নতুন আপডেট পোস্ট করেছেন`).slice(0, 100),
    url: '/',
  };

  await Promise.allSettled((allSubs || []).map((sub) => sendToSubscription(supabaseAdmin, sub, payload)));
}
