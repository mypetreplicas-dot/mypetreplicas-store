import { LanguageCode, PromotionItemAction } from '@vendure/core';

export const multiPetDiscountAction = new PromotionItemAction({
    code: 'multi_pet_discount',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Apply multi-pet discount based on special instructions tag',
        },
    ],
    args: {},
    execute(ctx, orderLine) {
        const specialInstructions = (orderLine.customFields as any)?.specialInstructions;

        if (!specialInstructions) {
            return 0;
        }

        // Extract discount percentage from tag: [Multi-pet 7% off]
        const discountMatch = specialInstructions.match(/\[Multi-pet (\d+)% off\]/);

        if (!discountMatch) {
            return 0;
        }

        const discountPercentage = parseInt(discountMatch[1], 10);

        // Calculate discount amount
        const discountAmount = Math.round((orderLine.proratedUnitPrice * discountPercentage) / 100);

        return -discountAmount;
    },
});
