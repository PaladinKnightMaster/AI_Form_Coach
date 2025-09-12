// Food caching utility for offline access using IndexedDB

import { MappedFoodData } from './openFoodFacts';

const DB_NAME = 'AIFormCoachFoodCache';
const DB_VERSION = 1;
const STORE_NAME = 'cachedFoods';

interface CachedFoodItem {
  barcode: string;
  foodData: MappedFoodData;
  timestamp: number;
  userId?: string;
}

class FoodCacheManager {
  private db: IDBDatabase | null = null;
  private readonly maxCacheSize = 50;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB for food cache');
        reject(new Error('Failed to initialize food cache'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'barcode' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  async cacheFood(barcode: string, foodData: MappedFoodData, userId?: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const item: CachedFoodItem = {
        barcode,
        foodData,
        timestamp: Date.now(),
        userId
      };

      const request = store.put(item);

      request.onsuccess = async () => {
        // Clean up old entries if cache is full
        await this.cleanupOldEntries();
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache food item');
        reject(new Error('Failed to cache food item'));
      };
    });
  }

  async getCachedFood(barcode: string, userId?: string): Promise<MappedFoodData | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(barcode);

      request.onsuccess = () => {
        const result = request.result as CachedFoodItem | undefined;
        
        if (result && (!userId || result.userId === userId)) {
          resolve(result.foodData);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve cached food item');
        reject(new Error('Failed to retrieve cached food item'));
      };
    });
  }

  async getAllCachedFoods(userId?: string): Promise<Map<string, MappedFoodData>> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedFoodItem[];
        const foodMap = new Map<string, MappedFoodData>();

        results
          .filter(item => !userId || item.userId === userId)
          .forEach(item => {
            foodMap.set(item.barcode, item.foodData);
          });

        resolve(foodMap);
      };

      request.onerror = () => {
        console.error('Failed to retrieve all cached foods');
        reject(new Error('Failed to retrieve all cached foods'));
      };
    });
  }

  async clearCache(userId?: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      if (userId) {
        // Clear only user-specific items
        const index = store.index('userId');
        const request = index.openCursor(IDBKeyRange.only(userId));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Failed to clear user cache');
          reject(new Error('Failed to clear user cache'));
        };
      } else {
        // Clear all items
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to clear cache');
          reject(new Error('Failed to clear cache'));
        };
      }
    });
  }

  private async cleanupOldEntries(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const count = countRequest.result;
        
        if (count <= this.maxCacheSize) {
          resolve();
          return;
        }

        // Get oldest entries to remove
        const index = store.index('timestamp');
        const request = index.openCursor();

        const itemsToDelete: string[] = [];
        const itemsToKeep = count - this.maxCacheSize;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          
          if (cursor && itemsToDelete.length < itemsToKeep) {
            itemsToDelete.push(cursor.key as string);
            cursor.continue();
          } else {
            // Delete oldest items
            const deletePromises = itemsToDelete.map(barcode => {
              return new Promise<void>((deleteResolve, deleteReject) => {
                const deleteRequest = store.delete(barcode);
                deleteRequest.onsuccess = () => deleteResolve();
                deleteRequest.onerror = () => deleteReject(new Error('Failed to delete old cache entry'));
              });
            });

            Promise.all(deletePromises)
              .then(() => resolve())
              .catch(reject);
          }
        };

        request.onerror = () => {
          console.error('Failed to cleanup old cache entries');
          reject(new Error('Failed to cleanup old cache entries'));
        };
      };

      countRequest.onerror = () => {
        console.error('Failed to count cache entries');
        reject(new Error('Failed to count cache entries'));
      };
    });
  }

  async getCacheStats(): Promise<{ totalItems: number; oldestItem?: Date; newestItem?: Date }> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedFoodItem[];
        
        if (results.length === 0) {
          resolve({ totalItems: 0 });
          return;
        }

        const timestamps = results.map(item => item.timestamp);
        const oldestItem = new Date(Math.min(...timestamps));
        const newestItem = new Date(Math.max(...timestamps));

        resolve({
          totalItems: results.length,
          oldestItem,
          newestItem
        });
      };

      request.onerror = () => {
        console.error('Failed to get cache stats');
        reject(new Error('Failed to get cache stats'));
      };
    });
  }
}

// Export singleton instance
export const foodCacheManager = new FoodCacheManager();
