import { bootstrap, DefaultLogger, LogLevel, LanguageCode, InitialData } from '@vendure/core';
import { populate } from '@vendure/core/cli/populate';
import { config } from './vendure-config';

const initialData: InitialData = {
    defaultLanguage: LanguageCode.en,
    defaultZone: 'Americas',
    taxRates: [
        { name: 'Standard Tax', percentage: 0 },
    ],
    shippingMethods: [
        { name: 'Standard Shipping', price: 500 },
    ],
    countries: [
        { name: 'United States', code: 'US', zone: 'Americas' },
    ],
    collections: [],
    paymentMethods: [],
};

const appConfig = {
    ...config,
    logger: new DefaultLogger({ level: LogLevel.Info }),
};

populate(
    () => bootstrap(appConfig),
    initialData
)
    .then(app => app.close())
    .then(() => {
        console.log('✅ Populated default settings successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed to populate:', err);
        process.exit(1);
    });
