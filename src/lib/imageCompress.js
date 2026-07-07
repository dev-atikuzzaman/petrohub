// src/lib/imageCompress.js
// ব্রাউজারের নিজস্ব Canvas API ব্যবহার করে ছবি compress করা হয় —
// কোনো বাড়তি library লাগে না, তাই app এর সাইজও বাড়ে না।

/**
 * একটা image File নিয়ে resize + compress করে নতুন File রিটার্ন করে।
 * @param {File} file - মূল ছবি ফাইল
 * @param {Object} options
 * @param {number} options.maxWidth - সর্বোচ্চ প্রস্থ (px), এর বেশি হলে ছোট করা হবে
 * @param {number} options.maxHeight - সর্বোচ্চ উচ্চতা (px)
 * @param {number} options.quality - JPEG quality (0 থেকে 1, ডিফল্ট 0.8)
 * @returns {Promise<File>} compressed ফাইল
 */
export function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    // ছবি ছাড়া অন্য ফাইল (ভুলবশত) এলে বা GIF (animation নষ্ট হবে) এলে compress না করে আসলটাই রিটার্ন
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // অনুপাত ঠিক রেখে maxWidth/maxHeight এর মধ্যে আনা
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // compress fail করলে মূল ফাইলই ব্যবহার করা, যাতে আপলোড আটকে না যায়
              resolve(file);
              return;
            }
            // মূল ফাইলের নাম রেখেই নতুন compressed File বানানো (extension .jpg করা হলো
            // কারণ আমরা সবসময় JPEG এ output করছি, যেটা সবচেয়ে ছোট সাইজ দেয়)
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file); // ছবি লোড fail করলে মূল ফাইল দিয়েই কাজ চালানো
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('ছবি পড়তে সমস্যা হয়েছে'));
    reader.readAsDataURL(file);
  });
}

/**
 * প্রোফাইল avatar এর জন্য — ছোট সাইজ যথেষ্ট (বড় করে দেখানো হয় না)
 */
export function compressAvatar(file) {
  return compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.82 });
}

/**
 * পোস্টের ছবির জন্য — একটু বড় রাখা হলো যাতে স্পষ্ট দেখা যায়
 */
export function compressPostImage(file) {
  return compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.78 });
}
