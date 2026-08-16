import { toggleReaction, toggleCommentReaction, toggleSavePost } from './dataService';

// supabase.from(...) সাধারণত একটা chainable query-builder ফেরত দেয়
// (.select().eq().eq().maybeSingle() ইত্যাদি)। প্রতিটা টেস্টে ঠিক কোন
// chain কল হচ্ছে তার ওপর ভিত্তি করে আলাদা mock builder বানানো হয়েছে,
// যাতে toggleReaction-এর তিনটা শাখাই (added / updated / removed)
// আসল লজিকের মতো precisely যাচাই করা যায়।
jest.mock('./supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from './supabaseClient';

describe('toggleReaction', () => {
  beforeEach(() => jest.clearAllMocks());

  test('আগে কোনো reaction না থাকলে নতুন reaction যোগ (added) হয়', async () => {
    const selectChain = {
      select: () => selectChain,
      eq: () => selectChain,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    const insertChain = {
      insert: jest.fn(() => insertChain),
      select: () => insertChain,
      single: () => Promise.resolve({ data: { id: 'r1', emoji: '👍' }, error: null }),
    };
    supabase.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(insertChain);

    const result = await toggleReaction('post-1', 'user-1', '👍');

    expect(result.action).toBe('added');
    expect(insertChain.insert).toHaveBeenCalledWith({ post_id: 'post-1', user_id: 'user-1', emoji: '👍' });
  });

  test('একই emoji-তে আবার react করলে reaction সরিয়ে দেয় (removed)', async () => {
    const selectChain = {
      select: () => selectChain,
      eq: () => selectChain,
      maybeSingle: () => Promise.resolve({ data: { id: 'r1', emoji: '👍' }, error: null }),
    };
    const deleteChain = {
      delete: jest.fn(() => deleteChain),
      eq: jest.fn(() => Promise.resolve({ error: null })),
    };
    supabase.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(deleteChain);

    const result = await toggleReaction('post-1', 'user-1', '👍');

    expect(result.action).toBe('removed');
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'r1');
  });

  test('ভিন্ন emoji দিয়ে react করলে পুরনো reaction আপডেট হয় (updated), নতুন করে insert হয় না', async () => {
    const selectChain = {
      select: () => selectChain,
      eq: () => selectChain,
      maybeSingle: () => Promise.resolve({ data: { id: 'r1', emoji: '👍' }, error: null }),
    };
    const updateChain = {
      update: jest.fn(() => updateChain),
      eq: () => updateChain,
      select: () => updateChain,
      single: () => Promise.resolve({ data: { id: 'r1', emoji: '❤️' }, error: null }),
    };
    supabase.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain);

    const result = await toggleReaction('post-1', 'user-1', '❤️');

    expect(result.action).toBe('updated');
    expect(updateChain.update).toHaveBeenCalledWith({ emoji: '❤️' });
  });
});

describe('toggleCommentReaction', () => {
  beforeEach(() => jest.clearAllMocks());

  test('comment-এ আগে reaction না থাকলে যোগ হয়', async () => {
    const selectChain = {
      select: () => selectChain,
      eq: () => selectChain,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    const insertChain = {
      insert: jest.fn(() => insertChain),
      select: () => insertChain,
      single: () => Promise.resolve({ data: { id: 'cr1' }, error: null }),
    };
    supabase.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(insertChain);

    const result = await toggleCommentReaction('comment-1', 'user-1', '😂');

    expect(result.action).toBe('added');
    expect(insertChain.insert).toHaveBeenCalledWith({ comment_id: 'comment-1', user_id: 'user-1', emoji: '😂' });
  });
});

describe('toggleSavePost', () => {
  beforeEach(() => jest.clearAllMocks());

  test('আগে থেকে save করা থাকলে (currentlySaved=true) মুছে দেয় এবং saved:false ফেরত দেয়', async () => {
    const deleteChain = {
      delete: jest.fn(() => deleteChain),
      eq: jest.fn()
        .mockImplementationOnce(() => deleteChain)
        .mockImplementationOnce(() => Promise.resolve({ error: null })),
    };
    supabase.from.mockReturnValue(deleteChain);

    const result = await toggleSavePost('user-1', 'post-1', true);

    expect(result.saved).toBe(false);
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1');
    expect(deleteChain.eq).toHaveBeenNthCalledWith(2, 'post_id', 'post-1');
  });

  test('আগে save করা না থাকলে (currentlySaved=false) নতুন insert করে এবং saved:true ফেরত দেয়', async () => {
    const insertChain = {
      insert: jest.fn(() => Promise.resolve({ error: null })),
    };
    supabase.from.mockReturnValue(insertChain);

    const result = await toggleSavePost('user-1', 'post-1', false);

    expect(result.saved).toBe(true);
    expect(insertChain.insert).toHaveBeenCalledWith({ user_id: 'user-1', post_id: 'post-1' });
  });
});
