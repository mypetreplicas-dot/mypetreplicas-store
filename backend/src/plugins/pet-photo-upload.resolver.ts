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
        const assets = [];
        for (const filePromise of args.files) {
            // AssetService.create() does `await input.file` internally,
            // so we pass the raw upload promise as `file`.
            const asset = await this.assetService.create(ctx, {
                file: filePromise,
            });
            if ('id' in asset) {
                assets.push(asset);
            } else {
                console.error('Failed to create asset:', asset);
            }
        }
        return assets;
    }
}
