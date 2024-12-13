import MeiliSearch from "meilisearch";

export class Meilisearch {
    private static instance: Meilisearch;
    public client: MeiliSearch;

    public constructor() {
        this.client = new MeiliSearch({
            host:
                process.env.NODE_ENV === "production"
                    ? process.env.MEILISEARCH_URI_PROD
                    : process.env.MEILISEARCH_URI_DEV,
        });
    }

    public static getInstance(): Meilisearch {
        if (!Meilisearch.instance) {
            Meilisearch.instance = new Meilisearch();
        }
        return Meilisearch.instance;
    }

    public getClient(): MeiliSearch {
        return this.client;
    }

    async createIndex(indexName: string): Promise<void> {
        await this.client.createIndex(indexName);
    }

    async deleteIndex(indexName: string): Promise<void> {
        await this.client.deleteIndex(indexName);
    }

    async search(indexName: string, query: string): Promise<any> {
        return await this.client.index(indexName).search(query);
    }

    async addDocuments(indexName: string, documents: any[]): Promise<void> {
        await this.client.index(indexName).addDocuments(documents);
    }

    async updateDocuments(indexName: string, documents: any[]): Promise<void> {
        await this.client.index(indexName).updateDocuments(documents);
    }

    async deleteDocuments(indexName: string, documentIds: string[]): Promise<void> {
        await this.client.index(indexName).deleteDocuments(documentIds);
    }

    async getDocument(indexName: string, documentId: string): Promise<any> {
        return await this.client.index(indexName).getDocument(documentId);
    }
}
