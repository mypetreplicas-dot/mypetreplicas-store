'use client';

import { useState } from 'react';
import type { Product, ProductVariant, OptionGroup } from '@/lib/vendure';
import { uploadPetPhotos, getEnabledVariants } from '@/lib/vendure';
import { useCart, getVendureToken } from '@/context/CartContext';

interface ProductConfiguratorProps {
    product: Product;
}

interface PetConfig {
    id: string;
    selectedOptions: Record<string, string>;
    uploadedFiles: File[];
    preferredPhotoIndex: number | null;
    specialInstructions: string;
    skipImages: boolean;
    isDragging: boolean;
}

export default function ProductConfigurator({ product }: ProductConfiguratorProps) {
    const { addToCart } = useCart();

    // Filter to only enabled variants
    const enabledVariants = getEnabledVariants(product.variants);

    // Filter option groups to only show options that have at least one enabled variant.
    // Hide entire groups that have only one remaining option (no choice to make).
    const optionGroups: OptionGroup[] = (product.optionGroups || [])
        .map(group => ({
            ...group,
            options: group.options.filter(option =>
                enabledVariants.some(variant =>
                    variant.options?.some(vo => vo.group.code === group.code && vo.code === option.code)
                )
            ),
        }))
        .filter(group => group.options.length > 1);

    // Handle case where all variants are disabled
    if (enabledVariants.length === 0) {
        return (
            <div className="p-8 rounded-xl bg-neutral-800/50 border border-neutral-700 text-center">
                <p className="text-neutral-400 text-lg">
                    This product is currently unavailable.
                </p>
                <p className="text-neutral-500 text-sm mt-2">
                    Please check back later or contact us for more information.
                </p>
            </div>
        );
    }

    // Initialize default selections
    const getDefaultSelections = () => {
        const selections: Record<string, string> = {};
        for (const group of optionGroups) {
            if (group.options.length > 0) {
                selections[group.code] = group.options[0].code;
            }
        }
        return selections;
    };

    // State: array of pets
    const [pets, setPets] = useState<PetConfig[]>([
        {
            id: '1',
            selectedOptions: getDefaultSelections(),
            uploadedFiles: [],
            preferredPhotoIndex: null,
            specialInstructions: '',
            skipImages: false,
            isDragging: false,
        }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const groupLabels: Record<string, string> = {
        size: 'Select Size',
        base: 'Display Base',
    };

    // Add a new pet
    const handleAddPet = () => {
        const newPet: PetConfig = {
            id: Date.now().toString(),
            selectedOptions: getDefaultSelections(),
            uploadedFiles: [],
            preferredPhotoIndex: null,
            specialInstructions: '',
            skipImages: false,
            isDragging: false,
        };
        setPets([...pets, newPet]);
    };

    // Remove a pet
    const handleRemovePet = (petId: string) => {
        if (pets.length > 1) {
            setPets(pets.filter(p => p.id !== petId));
        }
    };

    // Update pet option
    const updatePetOption = (petId: string, groupCode: string, optionCode: string) => {
        setPets(pets.map(pet =>
            pet.id === petId
                ? { ...pet, selectedOptions: { ...pet.selectedOptions, [groupCode]: optionCode } }
                : pet
        ));
    };

    // Update pet field
    const updatePetField = (petId: string, field: keyof PetConfig, value: any) => {
        setPets(prev => prev.map(pet =>
            pet.id === petId ? { ...pet, [field]: value } : pet
        ));
    };

    // Find variant for a pet's selections
    // Only match against visible option groups (hidden groups are irrelevant)
    const visibleGroupCodes = optionGroups.map(g => g.code);
    const getVariantForPet = (pet: PetConfig): ProductVariant | undefined => {
        if (optionGroups.length === 0) {
            return enabledVariants[0];
        }
        const visibleSelections = Object.entries(pet.selectedOptions)
            .filter(([groupCode]) => visibleGroupCodes.includes(groupCode));
        return enabledVariants.find((variant) => {
            if (!variant.options) return false;
            return visibleSelections.every(([groupCode, optionCode]) =>
                variant.options!.some((vo) => vo.group.code === groupCode && vo.code === optionCode)
            );
        });
    };

    // Calculate price for a pet with progressive tiering
    // Pet 1: $150 (full), Pet 2: $140 (7% off), Pet 3: $130 (13% off), Pet 4+: $120 (20% off)
    const getPriceForPet = (petIndex: number, variant: ProductVariant | undefined) => {
        if (!variant || typeof variant.price !== 'number' || isNaN(variant.price)) return null;
        const basePrice = variant.price / 100;

        if (petIndex === 0) return basePrice; // Full price
        if (petIndex === 1) return basePrice * 0.93; // 7% off
        if (petIndex === 2) return basePrice * 0.87; // 13% off
        return basePrice * 0.80; // 20% off for pet 4+
    };

    // Get discount percentage for badge
    const getDiscountPercent = (petIndex: number) => {
        if (petIndex === 0) return null;
        if (petIndex === 1) return 7;
        if (petIndex === 2) return 13;
        return 20;
    };

    const handleAddToCart = async () => {
        // Validate all pets
        for (let i = 0; i < pets.length; i++) {
            const pet = pets[i];
            if (!pet.skipImages && pet.uploadedFiles.length < 3) {
                alert(`Please upload at least 3 photos for Pet ${i + 1}, or check "I'll add images later".`);
                return;
            }
            // Require preferred photo selection if photos are uploaded
            if (!pet.skipImages && pet.uploadedFiles.length > 0 && pet.preferredPhotoIndex === null) {
                alert(`Please select your preferred photo for Pet ${i + 1} by clicking the star icon.`);
                return;
            }
        }

        setIsAdding(true);

        try {
            // Process each pet and add to cart
            for (let i = 0; i < pets.length; i++) {
                const pet = pets[i];
                let assetIds: string[] = [];
                const variant = getVariantForPet(pet);

                if (!variant) {
                    alert(`Invalid configuration for Pet ${i + 1}`);
                    setIsAdding(false);
                    return;
                }



                if (!pet.skipImages && pet.uploadedFiles.length > 0) {
                    setUploadProgress(`Uploading photos for Pet ${i + 1}...`);
                    const token = getVendureToken();
                    const assets = await uploadPetPhotos(pet.uploadedFiles, token);
                    assetIds = assets.map((a) => a.id);
                }

                setUploadProgress(`Adding Pet ${i + 1} to cart...`);
                const isAdditionalPet = i > 0;
                const discountPercent = getDiscountPercent(i);
                const instructionParts: string[] = [];
                if (isAdditionalPet && discountPercent) instructionParts.push(`[Multi-pet ${discountPercent}% off]`);
                if (pet.skipImages) instructionParts.push('[Photos pending]');
                if (pet.preferredPhotoIndex !== null) instructionParts.push(`[Preferred pose: Photo ${pet.preferredPhotoIndex + 1}]`);
                if (pet.specialInstructions) instructionParts.push(pet.specialInstructions);

                await addToCart(variant.id, 1, {
                    specialInstructions: instructionParts.length > 0 ? instructionParts.join(' ') : undefined,
                    petPhotos: assetIds.length > 0 ? assetIds : undefined,
                });
            }

            setAdded(true);
            setUploadProgress('');
            setTimeout(() => setAdded(false), 3000);
        } catch (e) {
            console.error('Failed to add to cart:', e);
            setUploadProgress('');
            alert('Something went wrong. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-10">
            {pets.map((pet, petIndex) => {
                const variant = getVariantForPet(pet);
                const price = getPriceForPet(petIndex, variant);
                const priceDisplay = price !== null ? price.toFixed(2) : '—';
                const isAdditionalPet = petIndex > 0;

                return (
                    <div
                        key={pet.id}
                        className={`space-y-6 ${petIndex > 0 ? 'pt-10 border-t border-neutral-800' : ''}`}
                    >
                        {/* Pet Header */}
                        {pets.length > 1 && (
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">
                                    Pet {petIndex + 1}
                                    {isAdditionalPet && getDiscountPercent(petIndex) && (
                                        <span className="ml-2 text-xs font-semibold text-terra-400 bg-terra-500/10 px-2 py-1 rounded-full">
                                            {getDiscountPercent(petIndex)}% OFF
                                        </span>
                                    )}
                                </h3>
                                {petIndex > 0 && (
                                    <button
                                        onClick={() => handleRemovePet(pet.id)}
                                        className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Price */}
                        {petIndex === 0 && (
                            <div>
                                <span className="text-4xl font-display font-bold text-white">${priceDisplay}</span>
                                <span className="ml-2 text-sm text-neutral-500">USD + tax</span>
                            </div>
                        )}

                        {/* Option Group Selectors */}
                        {optionGroups.map((group) => (
                            <div key={group.id}>
                                <label className="block text-sm font-medium text-neutral-400 mb-3">
                                    {groupLabels[group.code] || group.name}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {group.options.map((option) => {
                                        const isSelected = pet.selectedOptions[group.code] === option.code;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => updatePetOption(pet.id, group.code, option.code)}
                                                className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${isSelected
                                                    ? 'bg-terra-600 text-white shadow-[0_0_16px_rgba(212,112,62,0.3)]'
                                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                                    }`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Photo Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-neutral-400">
                                    Upload Photos of Your Pet
                                </label>
                                <div className="text-xs text-terra-400 flex items-center gap-1 font-medium">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                    Select Preferred Pose
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 mb-5">
                                Upload at least 3 photos from different angles. Click the <span className="text-terra-400 font-semibold">star</span> to mark your preferred pose.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    const newSkip = !pet.skipImages;
                                    updatePetField(pet.id, 'skipImages', newSkip);
                                    if (newSkip) {
                                        updatePetField(pet.id, 'uploadedFiles', []);
                                        updatePetField(pet.id, 'preferredPhotoIndex', null);
                                    }
                                }}
                                className="flex items-center gap-3 mb-5 group cursor-pointer"
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${pet.skipImages
                                    ? 'bg-terra-600 border-terra-600'
                                    : 'border-neutral-700 bg-neutral-800/50'
                                    }`}>
                                    {pet.skipImages && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                                    I'll add images later
                                </span>
                            </button>

                            {!pet.skipImages ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {[...Array(6)].map((_, index) => {
                                        const hasPhoto = pet.uploadedFiles[index];
                                        const isPreferred = pet.preferredPhotoIndex === index;

                                        return (
                                            <div key={index} className="aspect-square relative rounded-lg overflow-hidden group">
                                                {hasPhoto ? (
                                                    <>
                                                        {/* Photo Thumbnail */}
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={URL.createObjectURL(hasPhoto)}
                                                            alt={`Pet photo ${index + 1}`}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                        />

                                                        {/* Star Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => updatePetField(pet.id, 'preferredPhotoIndex', index)}
                                                            className={`absolute top-2 right-2 z-10 transition-all ${isPreferred
                                                                ? 'text-terra-400 scale-110 drop-shadow-[0_0_8px_rgba(212,112,62,0.8)]'
                                                                : 'text-white/40 hover:text-terra-400'
                                                                }`}
                                                        >
                                                            <svg className="w-6 h-6" fill={isPreferred ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isPreferred ? 0 : 2} viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                            </svg>
                                                        </button>

                                                        {/* Remove Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newFiles = pet.uploadedFiles.filter((_, i) => i !== index);
                                                                updatePetField(pet.id, 'uploadedFiles', newFiles);
                                                                if (pet.preferredPhotoIndex === index) {
                                                                    updatePetField(pet.id, 'preferredPhotoIndex', null);
                                                                } else if (pet.preferredPhotoIndex !== null && pet.preferredPhotoIndex > index) {
                                                                    updatePetField(pet.id, 'preferredPhotoIndex', pet.preferredPhotoIndex - 1);
                                                                }
                                                            }}
                                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                        >
                                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Upload Button */}
                                                        <input
                                                            type="file"
                                                            id={`pet-photo-${pet.id}-${index}`}
                                                            accept="image/jpeg,image/png"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const files = e.target.files;
                                                                if (files && files[0]) {
                                                                    const validTypes = ['image/jpeg', 'image/png'];
                                                                    const maxSize = 10 * 1024 * 1024;

                                                                    if (!validTypes.includes(files[0].type)) {
                                                                        alert('Please upload a JPG or PNG image');
                                                                        return;
                                                                    }
                                                                    if (files[0].size > maxSize) {
                                                                        alert('File size must be less than 10MB');
                                                                        return;
                                                                    }

                                                                    const newFiles = [...pet.uploadedFiles];
                                                                    newFiles[index] = files[0];
                                                                    updatePetField(pet.id, 'uploadedFiles', newFiles.filter(Boolean));

                                                                    // Auto-select first photo as preferred
                                                                    if (pet.preferredPhotoIndex === null) {
                                                                        updatePetField(pet.id, 'preferredPhotoIndex', index);
                                                                    }
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`pet-photo-${pet.id}-${index}`}
                                                            className="absolute inset-0 border border-dashed border-neutral-700 hover:border-terra-500/50 hover:bg-terra-500/5 rounded-lg transition-all cursor-pointer flex items-center justify-center bg-neutral-800/20"
                                                        >
                                                            <svg className="w-8 h-8 text-neutral-600 group-hover:text-terra-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                            </svg>
                                                        </label>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-terra-500/10 border border-terra-500/20 rounded-xl">
                                    <div className="flex-shrink-0 w-8 h-8 bg-terra-600/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-neutral-300">
                                        Got it! We'll email you immediately after your order so you can securely send us your pet's photos.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Special Instructions */}
                        <div>
                            <label htmlFor={`special-instructions-${pet.id}`} className="block text-sm font-medium text-neutral-400 mb-3">
                                Special Instructions
                                <span className="text-neutral-600 ml-1">(optional)</span>
                            </label>
                            <textarea
                                id={`special-instructions-${pet.id}`}
                                rows={3}
                                value={pet.specialInstructions}
                                onChange={(e) => updatePetField(pet.id, 'specialInstructions', e.target.value)}
                                placeholder="Any specific details about your pet's markings, pose preferences, or nameplate text..."
                                className="w-full rounded-xl bg-neutral-800/50 px-5 py-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40 resize-none transition-all"
                            />
                        </div>

                        {/* Add Another Pet button (only after first pet's instructions) */}
                        {/* 
                        petIndex === pets.length - 1 && (
                            <div className="pt-4">
                                <button
                                    onClick={handleAddPet}
                                    className="w-full py-4 px-8 rounded-full text-base font-semibold transition-all bg-neutral-800 hover:bg-neutral-700 text-white border-2 border-terra-600/30 hover:border-terra-600/50"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Add Another Pet <span className="text-terra-400">(save up to 20%)</span>
                                    </span>
                                </button>
                            </div>
                        )
                        */}
                    </div>
                );
            })}

            {/* CTA: "Create My Pet Replica" */}
            <div className="pt-4">
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`w-full py-4 px-8 rounded-full text-lg font-semibold transition-all ${added
                        ? 'bg-terra-700 text-white'
                        : 'bg-terra-600 hover:bg-terra-500 text-white shadow-[0_0_32px_rgba(212,112,62,0.3)] hover:shadow-[0_0_48px_rgba(212,112,62,0.5)]'
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {isAdding ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {uploadProgress || 'Processing…'}
                        </span>
                    ) : added ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Added to Cart
                        </span>
                    ) : (
                        `Add to Cart →`
                    )}
                </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-neutral-500 pt-2">
                <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Free shipping
                </span>
                <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Secure checkout
                </span>
                <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    5-star rated on Etsy
                </span>
            </div>

            {/* Subtle pricing info at bottom */}
            {/* 
            pets.length > 1 && (
                <div className="mt-6 pt-6 border-t border-neutral-800/50">
                    <p className="text-xs text-neutral-600 mb-3">
                        <span className="font-medium text-neutral-500">Multi-pet pricing:</span> Each additional pet receives a progressive discount
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
                        <div>Pet 1: Full price</div>
                        <div>Pet 2: 7% off</div>
                        <div>Pet 3: 13% off</div>
                        <div>Pet 4+: 20% off</div>
                    </div>
                </div>
            )
            */}
        </div>
    );
}
