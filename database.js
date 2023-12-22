const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    mongoose
      .connect(
        'mongodb+srv://akellock:jWqZd0MIDlfQvnUf@cluster0.u1n4ojw.mongodb.net/?retryWrites=true&w=majority'
      )
      .then(() => {
        console.log('🤘 DB connection successful 🤘');
      })
      .catch((err) => {
        console.log('👹 Database connection failed 👹 ' + err.message);
      });
  }
}

module.exports = new Database();
