const b = new Blob(['{"test": 123}']);
b.text().then(console.log);
