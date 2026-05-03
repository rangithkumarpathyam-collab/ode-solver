import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, 'db.json');

const readDB = () => {
  if (fs.existsSync(dbPath)) {
    try {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      return { users: [], history: [] };
    }
  }
  return { users: [], history: [] };
};

const writeDB = (data: any) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const createMockModel = (collectionName: string) => {
  return {
    findOne: async (query: any) => {
      const db = readDB();
      const coll = db[collectionName] || [];
      return coll.find((item: any) => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
    },
    findById: async (id: string) => {
      const db = readDB();
      const coll = db[collectionName] || [];
      return coll.find((item: any) => item._id === id);
    },
    find: (query: any) => {
      const db = readDB();
      const coll = db[collectionName] || [];
      const results = coll.filter((item: any) => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
      return {
        sort: (sortObj: any) => {
          return results.reverse(); // Simplified sort for createdAt: -1
        }
      };
    },
    create: async (data: any) => {
      const db = readDB();
      if (!db[collectionName]) db[collectionName] = [];
      const newItem = { _id: Date.now().toString() + Math.random().toString(36).substr(2, 5), createdAt: new Date().toISOString(), ...data };
      db[collectionName].push(newItem);
      writeDB(db);
      return newItem;
    }
  };
};
