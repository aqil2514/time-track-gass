// desktop/src/lib/aiRetryQueue.ts

export interface AiRetryItem {
    id: string; // This is the ActivityID (UUID) now
    capturedAt: string;
    imageBase64: string;
    retryCount: number;
    lastError?: string;
}

const DB_NAME = 'TimeTrackAI';
const STORE_NAME = 'retryQueue';

// Simple Promisified IndexedDB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveAiRetry(activityId: string, base64: string, capturedAt: string = new Date().toISOString()): Promise<void> {
    const db = await openDB();
    const item: AiRetryItem = {
        id: activityId,
        capturedAt,
        imageBase64: base64,
        retryCount: 0
    };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getAiRetries(): Promise<AiRetryItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteAiRetry(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function updateAiRetry(id: string, count: number, error: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
            const data = req.result as AiRetryItem;
            if (data) {
                data.retryCount = count;
                data.lastError = error;
                store.put(data);
            }
            resolve();
        };
        req.onerror = () => reject(req.error);
    });
}

// Check if an activity is already in the retry queue
export async function isInRetryQueue(activityId: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(activityId);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => reject(req.error);
    });
}
