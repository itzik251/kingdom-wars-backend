"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const allowedOrigins = [
        'https://kingdomwars.cloud',
        'https://www.kingdomwars.cloud',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        },
        credentials: true,
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'), {
        setHeaders: (res, path) => {
            if (path.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            else {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        },
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Kingdom Wars API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map