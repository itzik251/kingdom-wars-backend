export declare const api: {
    get: (url: string) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    patch: (url: string, data?: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
};
