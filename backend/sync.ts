import { bootstrap } from '@vendure/core';
import { config } from './src/vendure-config';

async function runSync() {
    process.env.APP_ENV = 'prod';
    
    // Cast config to any to bypass readonly restrictions
    const mutableConfig: any = config;
    mutableConfig.dbConnectionOptions.migrations = [];
    mutableConfig.dbConnectionOptions.synchronize = true;
    
    console.log(`Starting Vendure bootstrap with synchronize=true for remote DB...`);
    
    const app = await bootstrap(mutableConfig);
    console.log('Vendure bootstrapped successfully. Schema should be synced.');
    process.exit(0);
}

runSync().catch(err => {
    console.error('Error syncing:', err);
    process.exit(1);
});
