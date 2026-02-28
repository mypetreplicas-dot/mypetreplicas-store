import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, AssetService, Allow, Permission } from '@vendure/core';
import gql from 'graphql-tag';

@Resolver()
export class PetPhotoUploadResolver {
    static schema = gql`
        extend type Mutation {
            uploadPetPhotos(files: [Upload!]!): [Asset!]!
        }
    `;

    constructor(private assetService: AssetService) { }

    @Mutation()
    @Allow(Permission.Public)
    async uploadPetPhotos(
        @Ctx() ctx: RequestContext,
        @Args() args: { files: any[] },
    ) {
        const uploadPromises = args.files.map(async (filePromise) => {
            try {
                const asset = await this.assetService.create(ctx, { file: filePromise });
                if ('id' in asset) {
                    return asset;
                }
                console.error('Failed to create asset:', asset);
                return null;
            } catch (error) {
                console.error('Error uploading asset:', error);
                return null;
            }
        });

        const results = await Promise.all(uploadPromises);
        return results.filter(asset => asset !== null);
    }
}
