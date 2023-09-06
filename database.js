const util = require('util');
var mysql = require('mysql');
try {
    var connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : '',
      database:'curant24'
    });
    connection.connect((err)=>{
      if(err){
        throw err;
      }
    });
    console.log("database is connected !")
/*
// Promisify MySQL query function
const query = util.promisify(connection.query).bind(connection);

// Define SQL queries to drop and add foreign key constraints
const dropForeignKeyQuery = 'ALTER TABLE ?? DROP FOREIGN KEY ??';
const addForeignKeyQuery = 'ALTER TABLE ?? ADD CONSTRAINT ?? FOREIGN KEY (??) REFERENCES ??(??) ON DELETE CASCADE';

// Define function to check if table has user_id foreign key
async function hasUserForeignKey(tableName) {
  // Get list of foreign keys for table
  const foreignKeys = await query(`SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND CONSTRAINT_NAME <> 'PRIMARY'`, [tableName, 'user_id']);
  // Check if user_id foreign key exists in list
  return foreignKeys.some(key => key.CONSTRAINT_NAME === 'user_id');
}

// Define function to loop through tables and drop/add foreign keys
async function updateForeignKeys() {
  // Get list of tables in database
  const tables = await query('SHOW TABLES');
  // Loop through each table and drop/add foreign keys
  for (const table of tables) {
    const tableName = table[`Tables_in_${connection.config.database}`];
    // Check if table has user_id foreign key
    const hasForeignKey = await hasUserForeignKey(tableName);
    if (hasForeignKey) {
      // Drop foreign key constraint
      await query(dropForeignKeyQuery, [tableName, 'user_id']);
      // Add foreign key constraint with ON DELETE CASCADE
      await query(addForeignKeyQuery, [tableName, 'user_id', 'user_id', 'users', 'id']);
      console.log(`Foreign key updated for table ${tableName}`);
    } else {
      console.log(`Table ${tableName} does not have a user_id foreign key`);
    }
  }
  console.log('Foreign keys updated successfully!');
}

// Call function to update foreign keys
updateForeignKeys();
*/
} catch (error) {
    console.log(error)
}
module.exports = connection; 
//database conn