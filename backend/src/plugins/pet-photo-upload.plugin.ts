import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { PetPhotoUploadResolver } from './pet-photo-upload.resolver';

/**
 * Plugin that exposes a Shop API mutation for customers to upload pet photos.
 * By default, Vendure's `createAssets` is Admin-only, so this plugin
 * bridges the gap by using the internal AssetService.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    shopApiExtensions: {
        resolvers: [PetPhotoUploadResolver],
        schema: PetPhotoUploadResolver.schema,
    },
})
export class PetPhotoUploadPlugin { }
