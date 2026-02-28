'use client';

import { useState, useCallback } from 'react';

interface OrderLine {
  id: string;
  productVariant: {
    name: string;
    product: {
      name: string;
    };
  };
  customFields: {
    specialInstructions: string | null;
    petPhotos: string | null;
  } | null;
}

interface UploadPhotosClientProps {
  orderCode: string;
  customerName: string;
  orderLines: OrderLine[];
}

export default function UploadPhotosClient({
  orderCode,
  customerName,
  orderLines,
}: UploadPhotosClientProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    const maxFiles = 10;

    const newFiles = Array.from(files).filter((file) => {
      if (!validTypes.includes(file.type)) {
        setError(`"${file.name}" is not a supported image format. Please use JPG, PNG, or WebP.`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" exceeds the 10MB file size limit.`);
        return false;
      }
      return true;
    });

    setUploadedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        setError(`You can upload up to ${maxFiles} photos.`);
        return combined.slice(0, maxFiles);
      }
      return combined;
    });
    setError('');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one photo.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Create FormData with photos
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('orderCode', orderCode);

      // Upload to backend
      const response = await fetch('/api/upload-order-photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploadComplete(true);
    } catch (e) {
      console.error('Upload failed:', e);
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terra-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3">Photos Received!</h1>
          <p className="text-neutral-400 mb-8">
            Thank you! We've received your pet photos and our artists will begin working on your custom replica.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-terra-600 hover:bg-terra-500 text-white rounded-lg font-medium transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 bg-terra-500/10 border border-terra-500/20 rounded-full mb-4">
            <span className="text-sm text-terra-400 font-medium">Order {orderCode}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Upload Your Pet Photos
          </h1>
          <p className="text-neutral-400 text-lg">
            Hi {customerName}! Please upload clear photos of your pet so our artists can create your custom replica.
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 mb-8">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
            Items in This Order
          </h2>
          <div className="space-y-3">
            {orderLines.map((line) => (
              <div key={line.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-terra-500"></div>
                <span className="text-neutral-300">{line.productVariant.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-8 mb-6">
          <h2 className="text-lg font-semibold text-white mb-6">Upload Photos</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'bg-terra-900/30 ring-2 ring-terra-500/50'
                : 'bg-neutral-800/50 hover:bg-neutral-800 border-2 border-dashed border-neutral-700'
            }`}
            onClick={() => document.getElementById('photo-upload-input')?.click()}
          >
            <input
              type="file"
              id="photo-upload-input"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-terra-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base text-neutral-300 mb-1">
                  <span className="text-terra-400 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-neutral-500">JPG, PNG, or WebP — max 10MB each (up to 10 photos)</p>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-neutral-400 mb-3">{uploadedFiles.length} photo(s) selected</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Pet photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-terra-500/5 border border-terra-500/10 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-terra-400 uppercase tracking-wide mb-3">Photo Tips</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-terra-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Clear, well-lit photos work best</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-terra-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Include multiple angles (front, side, and any unique markings)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-terra-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Close-ups of face and eyes help capture personality</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || uploadedFiles.length === 0}
          className="w-full py-4 px-8 rounded-full text-lg font-semibold bg-terra-600 hover:bg-terra-500 text-white shadow-[0_0_32px_rgba(212,112,62,0.3)] hover:shadow-[0_0_48px_rgba(212,112,62,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-terra-600 disabled:hover:shadow-[0_0_32px_rgba(212,112,62,0.3)]"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading Photos...
            </span>
          ) : (
            'Submit Photos'
          )}
        </button>

        {/* Security Note */}
        <p className="text-center text-xs text-neutral-600 mt-6">
          <svg className="inline w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          Your photos are securely uploaded and only used to create your custom pet replica
        </p>
      </div>
    </div>
  );
}
