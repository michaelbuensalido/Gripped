const { getDatabase } = require('./db/schema'); // Or whatever exposes DB
// Actually, I can just write a quick script that imports the queries module
import { initializeDatabase } from './db/schema';
import * as Q from './db/queries';

async function test() {
  try {
    await initializeDatabase();
    
    console.log("Testing getLogbookSummary...");
    Q.getLogbookSummary({
      viewMode: 'list',
      period: 'all',
      gym: null,
      minGradeIndex: null,
      searchQuery: null,
      sort: 'newest',
      showEmpty: false,
      selectedDate: null
    });
    console.log("Summary OK");

    console.log("Testing getLogbookHistory...");
    Q.getLogbookHistory({
      viewMode: 'list',
      period: 'all',
      gym: null,
      minGradeIndex: null,
      searchQuery: null,
      sort: 'newest',
      showEmpty: false,
      selectedDate: null
    });
    console.log("History OK");
    
  } catch (err) {
    console.error("SQLITE ERROR:", err);
  }
}

test();
