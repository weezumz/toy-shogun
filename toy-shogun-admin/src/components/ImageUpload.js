// ImageUpload.js
// Reusable image upload component using Supabase Storage.
// Accepts an existing image URL and a callback when a new image is uploaded.
// Used in both Inventory and Events pages.

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ImageUpload({ currentUrl, onUpload, folder = 'general' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    setError('');
    setUploading(true);

    // Generate a unique filename to avoid conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    // Get the public URL of the uploaded image
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    onUpload(data.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      {/* Image Preview */}
      {currentUrl && (
        <div style={{ marginBottom: '12px' }}>
          <img
            src={currentUrl}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      )}

      {/* Upload Button */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        border: '2px dashed #ddd',
        borderRadius: '8px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        backgroundColor: uploading ? '#f8f9fa' : '#fff',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a2e'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
      >
        <span style={{ fontSize: '1.5rem' }}>🖼️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e' }}>
            {uploading ? 'Uploading...' : currentUrl ? 'Change Image' : 'Upload Image'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>
            PNG, JPG, WEBP — max 2MB
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      {error && (
        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '6px' }}>
          {error}
        </div>
      )}
    </div>
  );
}