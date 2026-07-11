// src/lib/dataService.js
import { supabase } from './supabaseClient';

// ============================================================
// PROFILES
// ============================================================
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('❌ getAllProfiles error:', error.message);
    return [];
  }
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('❌ updateProfile error:', error.message);
  return { data, error };
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  // টাইমস্ট্যাম্প যোগ করা হলো যাতে প্রতিবার নতুন ছবি আপলোডে URL বদলায়
  // (নাহলে browser/CDN পুরনো ছবি cache করে রাখে এবং নতুন ছবি দেখায় না)
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('❌ uploadAvatar error:', uploadError.message);
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// ============================================================
// POSTS
// ============================================================
export async function getPostsWithDetails() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_user_id_fkey ( id, name, avatar_url, designation, company, current_company ),
      comments ( id, text, created_at, parent_id, user_id, author:profiles!comments_user_id_fkey ( id, name, avatar_url ) ),
      reactions ( id, emoji, user_id, user:profiles!reactions_user_id_fkey ( id, name, avatar_url ) )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ getPostsWithDetails error:', error.message);
    return [];
  }
  return data;
}

export async function createPost(userId, text, imageFile, privacy = 'public') {
  let image_url = null;

  if (imageFile) {
    const ext = imageFile.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, imageFile);

    if (uploadError) {
      console.error('❌ Post image upload error:', uploadError.message);
    } else {
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      image_url = data.publicUrl;
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, text, image_url, privacy })
    .select()
    .single();

  if (error) console.error('❌ createPost error:', error.message);
  return { data, error };
}

export async function deletePost(postId) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) console.error('❌ deletePost error:', error.message);
  return { error };
}

export async function updatePost(postId, updates) {
  // updates এ { text, privacy } থাকতে পারে — text বদলালে edited_at সেট করা হয়
  const payload = { ...updates };
  if (updates.text !== undefined) {
    payload.edited_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .select()
    .single();
  if (error) console.error('❌ updatePost error:', error.message);
  return { data, error };
}

// ============================================================
// COMMENTS
// ============================================================
export async function createComment(postId, userId, text, parentId = null) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, text, parent_id: parentId })
    .select()
    .single();
  if (error) console.error('❌ createComment error:', error.message);
  return { data, error };
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) console.error('❌ deleteComment error:', error.message);
  return { error };
}

// ============================================================
// REACTIONS
// ============================================================
export async function toggleReaction(postId, userId, emoji) {
  // ইউজারের আগের reaction আছে কিনা চেক
  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // একই emoji আবার চাপলে remove (un-react)
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
      return { action: 'removed', error };
    } else {
      // ভিন্ন emoji হলে update
      const { data, error } = await supabase
        .from('reactions')
        .update({ emoji })
        .eq('id', existing.id)
        .select()
        .single();
      return { action: 'updated', data, error };
    }
  } else {
    const { data, error } = await supabase
      .from('reactions')
      .insert({ post_id: postId, user_id: userId, emoji })
      .select()
      .single();
    return { action: 'added', data, error };
  }
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
// একটাই channel এ posts, comments, reactions, profiles — সব টেবিল
// একসাথে subscribe করা হয়েছে। আলাদা আলাদা channel রাখলে প্রতিটার
// জন্য আলাদা websocket handshake লাগে, যেটা প্রথমবার connect হতে
// দেরি করায়। একটা channel এ সব একসাথে রাখলে handshake একবারই হয়।
export function subscribeToAppChanges(onChange) {
  const wrappedOnChange = (payload) => {
    console.log('📡 Realtime event:', payload.table, payload.eventType, payload.new || payload.old);
    onChange(payload);
  };

  const channel = supabase
    .channel('public:petro-hub-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, wrappedOnChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, wrappedOnChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, wrappedOnChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, wrappedOnChange)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime channel connected (posts + profiles)');
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn('⚠️ Realtime channel status:', status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// পুরনো নাম দুটো এখনও কাজ করবে (backward-compatible alias),
// যাতে আগের import করা কোড ভেঙে না যায়
export const subscribeToPosts = subscribeToAppChanges;
export function subscribeToProfiles() {
  // এখন profiles ও একই merged channel এর মধ্যে আছে, তাই এটা আলাদা
  // কিছু করে না — শুধু একটা no-op cleanup ফাংশন রিটার্ন করে।
  return () => {};
}

// ============================================================
// NOTES (private — শুধু নিজের)
// ============================================================
export async function getNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('❌ getNotes:', error.message); return []; }
  return data;
}

export async function createNote(userId, { title, body, color }) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title, body, color })
    .select().single();
  if (error) console.error('❌ createNote:', error.message);
  return { data, error };
}

export async function updateNote(noteId, updates) {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select().single();
  if (error) console.error('❌ updateNote:', error.message);
  return { data, error };
}

export async function deleteNote(noteId) {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) console.error('❌ deleteNote:', error.message);
  return { error };
}

// ============================================================
// IMPORTANT UPDATES (সবাই দেখবে)
// ============================================================
export async function getImportantUpdates() {
  const { data, error } = await supabase
    .from('important_updates')
    .select('*, author:profiles!important_updates_user_id_fkey(id, name, avatar_url, designation)')
    .order('created_at', { ascending: false });
  if (error) { console.error('❌ getImportantUpdates:', error.message); return []; }
  return data;
}

export async function createImportantUpdate(userId, { title, body, priority, start_date, deadline }) {
  const { data, error } = await supabase
    .from('important_updates')
    .insert({ user_id: userId, title, body, priority, start_date: start_date || null, deadline: deadline || null })
    .select().single();
  if (error) console.error('❌ createImportantUpdate:', error.message);
  return { data, error };
}

export async function updateImportantUpdate(id, { title, body, priority, start_date, deadline }) {
  const { data, error } = await supabase
    .from('important_updates')
    .update({ title, body, priority, start_date: start_date || null, deadline: deadline || null })
    .eq('id', id)
    .select().single();
  if (error) console.error('❌ updateImportantUpdate:', error.message);
  return { data, error };
}

export async function deleteImportantUpdate(id) {
  const { error } = await supabase.from('important_updates').delete().eq('id', id);
  if (error) console.error('❌ deleteImportantUpdate:', error.message);
  return { error };
}

// ============================================================
// DOCUMENTS (যেকোনো ফাইল)
// ============================================================
export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*, uploader:profiles!documents_user_id_fkey(id, name, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) { console.error('❌ getDocuments:', error.message); return []; }
  return data;
}

export async function uploadDocument(userId, file, { title, description, category }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file);

  if (uploadError) {
    console.error('❌ uploadDocument storage:', uploadError.message);
    return { error: uploadError };
  }

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title: title || file.name,
      description: description || '',
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || '',
      category,
    })
    .select().single();

  if (error) console.error('❌ uploadDocument db:', error.message);
  return { data, error };
}

export async function updateDocument(docId, { title, description, category }) {
  const { data, error } = await supabase
    .from('documents')
    .update({ title, description, category })
    .eq('id', docId)
    .select().single();
  if (error) console.error('❌ updateDocument:', error.message);
  return { data, error };
}

export async function deleteDocument(docId, fileUrl) {
  // Storage থেকে ফাইল মুছা
  try {
    const url = new URL(fileUrl);
    const pathPart = url.pathname.split('/documents/')[1];
    if (pathPart) {
      await supabase.storage.from('documents').remove([decodeURIComponent(pathPart)]);
    }
  } catch (e) {
    console.warn('Storage delete warning:', e.message);
  }
  const { error } = await supabase.from('documents').delete().eq('id', docId);
  if (error) console.error('❌ deleteDocument:', error.message);
  return { error };
}

// ============================================================
// ADMIN — USER MANAGEMENT
// ============================================================
export async function getPendingApprovals() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  if (error) { console.error('❌ getPendingApprovals:', error.message); return []; }
  return data;
}

export async function approveUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('id', userId);
  if (error) console.error('❌ approveUser:', error.message);
  return { error };
}

export async function rejectUser(userId) {
  // profile মুছে দেওয়া (cascade এ auth.users থেকে মুছবে না, সেটা dashboard থেকে করতে হবে)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) console.error('❌ rejectUser:', error.message);
  return { error };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('❌ getAllUsers:', error.message); return []; }
  return data;
}

// Admin কর্তৃক নতুন user তৈরি (Supabase Admin API — শুধু service_role key দিয়ে কাজ করে,
// তাই এটা browser থেকে সরাসরি করা সম্ভব নয়। এর পরিবর্তে admin Supabase Dashboard →
// Authentication → Users → "Invite user" বা "Add user" ব্যবহার করবেন।
// নিচের ফাংশনটা pending_invites এ pre-load করার জন্য)
export async function preloadMember(memberData) {
  const { data, error } = await supabase
    .from('pending_invites')
    .insert(memberData)
    .select()
    .single();
  if (error) console.error('❌ preloadMember:', error.message);
  return { data, error };
}

export async function getPendingInvites() {
  const { data, error } = await supabase
    .from('pending_invites')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('❌ getPendingInvites:', error.message); return []; }
  return data;
}

export async function updatePendingInvite(id, updates) {
  const { data, error } = await supabase
    .from('pending_invites')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('❌ updatePendingInvite:', error.message);
  return { data, error };
}

export async function deletePendingInvite(id) {
  const { error } = await supabase.from('pending_invites').delete().eq('id', id);
  if (error) console.error('❌ deletePendingInvite:', error.message);
  return { error };
}
