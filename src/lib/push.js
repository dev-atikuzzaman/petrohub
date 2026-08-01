// src/lib/push.js
// ============================================================
// ব্রাউজার পুশ নোটিফিকেশন — সম্পূর্ণ ফ্রি Web Push API ব্যবহার করে
// (কোনো paid সার্ভিস/Firebase লাগে না, শুধু নিজের VAPID key জোড়া)
// ============================================================
import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

export async function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function isSubscribed() {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(userId) {
  if (!isPushSupported()) return { error: 'এই ব্রাউজার পুশ নোটিফিকেশন সাপোর্ট করে না' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { error: 'নোটিফিকেশনের অনুমতি দেওয়া হয়নি' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return { error: null };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}
