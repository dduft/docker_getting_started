const waitPort = require('wait-port');
const { Pool } = require('pg')
const fs = require('fs');

const {
    PG_HOST: HOST,
    PG_HOST_FILE: HOST_FILE,
    PG_USER: USER,
    PG_USER_FILE: USER_FILE,
    PG_PASSWORD: PASSWORD,
    PG_PASSWORD_FILE: PASSWORD_FILE,
    PG_DB: DB,
    PG_DB_FILE: DB_FILE,
    PG_SSL: SSL
} = process.env;

let pool;

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE) : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;
    const ssl = SSL === '1' ? true : false

    await waitPort({ host, port : 5432});

    pool = new Pool({
        user,
        host,
        database,
        password,
        ssl
    })

    return new Promise((acc, rej) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
            err => {
                if (err) return rej(err);

                console.log(`Connected to mysql db at host ${HOST}`);
                acc();
            },
        );
    });
}


async function teardown() {
    return new Promise((acc, rej) => {
        pool.end(err => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items', (err, res) => {
            if (err) return rej(err);
            acc(res.rows);
        });
    });
}

async function getItem(id) {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items WHERE id=$1', [id], (err, res) => {
            if (err) return rej(err);
            acc(res.rows[0]);
        });
    });
}

async function storeItem(item) {
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed) VALUES ($1, $2, $3)',
            [item.id, item.name, item.completed],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id, item) {
    console.log(item)
    console.log(id)
    return new Promise((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name = $1, completed = $2 WHERE id = $3',
            [item.name, item.completed, id],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id) {
    return new Promise((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id = $1', [id], err => {
            if (err) return rej(err);
            acc();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};