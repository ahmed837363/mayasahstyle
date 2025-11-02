'use strict';

/* global APPWRITE_CONFIG */

const Appwrite = window.Appwrite;

const appwriteClient = (() => {
    const client = new Appwrite.Client();
    client.setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.projectId);

    const account = new Appwrite.Account(client);
    const databases = new Appwrite.Databases(client);
    const storage = new Appwrite.Storage(client);

    return {
        client,
        account,
        databases,
        storage,
        getSession: () => account.get().catch(() => null)
    };
})();

window.appwriteClient = appwriteClient;
