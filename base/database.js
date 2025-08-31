import SQLite from "react-native-sqlite-storage";

SQLite.enablePromise(true);

export async function getDBConnection() {
    return SQLite.openDatabase({ name: "app.db", location: "default" });
}

export async function createTable(db, tableName, columns) {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
    return db.executeSql(query);
}

export async function insertItem(db, tableName, values, placeholders) {
    const query = `INSERT INTO ${tableName} VALUES (${placeholders});`;
    return db.executeSql(query, values);
}

export async function deleteItens(db, tableName) {
    const query = `DELETE FROM ${tableName}`
    return db.executeSql(query)
}

export async function getItems(db, tableName, columns = "*", where = "") {
    let query = `SELECT ${columns} FROM ${tableName}`;
    
    if (where) query += ` WHERE ${where}`;
  
    console.log('teste: ' + query)
    const results = await db.executeSql(query);
  
    const items = [];
    results.forEach(result => {
        for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i));
        }
    });
    return items;
}

export async function dropTable(db, tableName) {
    const query = `DROP TABLE ${tableName}`
    return db.executeSql(query);
}
