import { openDB } from 'idb';

const DB_NAME = 'WorkoutTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'workout_data';

const STORAGE_KEYS = [
    'workout_history',
    'workout_active',
    'workout_custom_types',
    'workout_unit_preference'
];

export const initDB = async () => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });

    // Check for migration
    const history = localStorage.getItem('workout_history');
    const active = localStorage.getItem('workout_active');

    // If we have history or active workout in LS, we migrate
    if (history || active) {
        console.log('Migrating from LocalStorage to IndexedDB...');
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const key of STORAGE_KEYS) {
            const val = localStorage.getItem(key);
            if (val) {
                // Determine if parsing is needed
                // 'workout_unit_preference' is just a raw string like "KG"
                if (key === 'workout_unit_preference') {
                    await store.put(val, key);
                } else {
                    try {
                        // JSON strings need parsing to be stored as Objects
                        await store.put(JSON.parse(val), key);
                    } catch (e) {
                        console.error(`Failed to migrate ${key}`, e);
                    }
                }
            }
        }
        await tx.done;

        // Cleanup LocalStorage
        STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        console.log('Migration complete.');
    }

    return db;
};

export const getData = async (key) => {
    const db = await openDB(DB_NAME, DB_VERSION);
    return await db.get(STORE_NAME, key);
};

export const setData = async (key, value) => {
    const db = await openDB(DB_NAME, DB_VERSION);
    return await db.put(STORE_NAME, value, key);
};

export const clearData = async () => {
    const db = await openDB(DB_NAME, DB_VERSION);
    return await db.clear(STORE_NAME);
};

// Helper for Export feature
export const getAllData = async () => {
    const db = await openDB(DB_NAME, DB_VERSION);
    const keys = await db.getAllKeys(STORE_NAME);
    const values = await db.getAll(STORE_NAME);
    const result = {};
    keys.forEach((key, i) => {
        result[key] = values[i];
    });
    return result;
};

// Helper for Import feature
export const importData = async (data) => {
    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // We expect data to have keys matching our STORAGE_KEYS
    // But verify keys
    for (const key of Object.keys(data)) {
        if (key === 'export_date' || key === 'app_version') continue;
        await store.put(data[key], key);
    }

    await tx.done;
};
